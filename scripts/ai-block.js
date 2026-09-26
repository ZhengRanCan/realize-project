#!/usr/bin/env node
'use strict';

/**
 * Stage 2 runner —— 逐块把已固定的 Visual Block Plan 转成该 Shape 所需的结构化 content。
 *
 * 边界（本轮硬约束）：
 * - AI **只返回** `{ shape, content }`；id / title / stage / shape / covers / sourceRefs /
 *   reviewObjects / defaultExpanded 全部由程序从 overview-plan 注入 —— 从结构上禁止 AI 修改 Plan。
 * - source-bounded：只喂 covers 的 sourceUnits + sourceRefs 指向的原文片段。
 * - 每个 block 只生成一次；语义失败不重试（传输层超时才重试）。
 *
 * 用法：
 *   npm run ai:block -- --block O-04
 *   npm run ai:block -- --select          # 按结构标准自动选 6 个 Pilot Block
 *   npm run ai:block -- --select --model gpt-5.6-sol
 */

// 与 ai-plan.js 同理：undici 的 headers timeout 必须先于首次 fetch 放宽。
process.env.UNDICI_HEADERS_TIMEOUT = process.env.UNDICI_HEADERS_TIMEOUT || '900000';
process.env.UNDICI_BODY_TIMEOUT = process.env.UNDICI_BODY_TIMEOUT || '900000';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

const DEFAULTS = {
  plan: path.join('fixtures', 'context-consumption.overview-plan.json'),
  design: path.join('fixtures', 'context-consumption.json'),
  prompt: path.join('ai', 'stage2-blocks.prompt.md'),
  catalog: path.join('docs', 'shape-catalog.md'),
  outDir: path.join('experiments', 'stage2'),
  model: 'gpt-5.6-sol',
  maxTokens: 16000,
  temperature: 1,
  timeoutMs: 900000,
  maxAttempts: 3,
};

const sha = (text) => crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);

/* ------------------------------------------------------------------ *
 * 参数
 * ------------------------------------------------------------------ */

function parseArgs(argv) {
  const args = { ...DEFAULTS };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) args[key] = true;
    else {
      args[key] = value;
      i += 1;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

/* ------------------------------------------------------------------ *
 * 凭据（与 ai-plan.js 同一策略）
 * ------------------------------------------------------------------ */

function readSettings() {
  const file = path.join(os.homedir(), '.dsh', 'settings.yaml');
  if (!fs.existsSync(file)) return {};
  const text = fs.readFileSync(file, 'utf8');
  const url = text.match(/apiUrl:\s*(\S+)/);
  const key = text.match(/apiKey:\s*(\S+)/);
  return { baseURL: url && url[1], apiKey: key && key[1] };
}

function resolveCredentials() {
  const settings = readSettings();
  const baseURL = process.env.OVERVIEW_PLAN_BASE_URL || settings.baseURL;
  const apiKey = process.env.OVERVIEW_PLAN_API_KEY || process.env.OPENAI_API_KEY || settings.apiKey;
  const model = process.env.OVERVIEW_PLAN_MODEL || args.model || DEFAULTS.model;
  if (!baseURL || !apiKey) {
    console.error('✗ 找不到可用的 API 凭据（OVERVIEW_PLAN_BASE_URL / OVERVIEW_PLAN_API_KEY 或 ~/.dsh/settings.yaml）');
    process.exit(2);
  }
  return { baseURL: baseURL.replace(/\/$/, ''), apiKey, model };
}

/* ------------------------------------------------------------------ *
 * Pilot Block 选择：按结构标准，不硬编码 ID
 * ------------------------------------------------------------------ */

/**
 * 6 类代表：复杂 current-target-flow、capability-matrix、ladder（最多的那个）、
 * walkthrough、combo、checklist（最多的那个）。
 * 每一类在同类里取"覆盖 sourceUnit 最多"的块；优先包含 core 多、negative-case/boundary 多、
 * 章节跨度大的块。
 */
function selectPilotBlocks(plan) {
  const unitById = new Map(plan.sourceUnits.map((u) => [u.id, u]));
  const score = (b) => {
    const units = (b.covers || []).map((id) => unitById.get(id)).filter(Boolean);
    const core = units.filter((u) => u.importance === 'core').length;
    const rich = units.filter((u) => ['negative-case', 'boundary', 'counterexample', 'current-state', 'target-state'].includes(u.kind)).length;
    const sections = new Set((b.sourceRefs || []).map((r) => r.section)).size;
    return units.length * 2 + core + rich + sections;
  };

  const wanted = ['current-target-flow', 'capability-matrix', 'ladder', 'walkthrough', 'combo', 'checklist'];
  const chosen = [];
  wanted.forEach((shape) => {
    const candidates = plan.blocks.filter((b) => b.shape === shape && !chosen.includes(b.id));
    if (candidates.length === 0) return;
    const best = candidates.slice().sort((a, b) => score(b) - score(a))[0];
    chosen.push(best.id);
  });
  return chosen;
}

/* ------------------------------------------------------------------ *
 * 组装 prompt
 * ------------------------------------------------------------------ */

function buildPrompt({ planBlock, units, excerpts, catalog, template }) {
  const unitsText = units
    .map(
      (u) =>
        `- ${u.id}｜section=${u.section}｜kind=${u.kind}｜importance=${u.importance}\n  statement：${u.statement}`
    )
    .join('\n');

  const excerptText = excerpts
    .map((e) => `#### ${e.section} ${e.title}（原文 L${e.startLine}-${e.endLine}）\n\n${e.text}`)
    .join('\n\n');

  return [
    template,
    '',
    '---',
    '',
    '# 本次输入',
    '',
    '<BLOCK_PLAN>',
    JSON.stringify(
      {
        id: planBlock.id,
        title: planBlock.title,
        stage: planBlock.stage,
        shape: planBlock.shape,
        covers: planBlock.covers,
        sourceRefs: planBlock.sourceRefs,
        reviewObjects: planBlock.reviewObjects,
        defaultExpanded: planBlock.defaultExpanded,
        ...(planBlock.capacityNote ? { capacityNote: planBlock.capacityNote } : {}),
      },
      null,
      2
    ),
    '</BLOCK_PLAN>',
    '',
    '<COVERED_UNITS>',
    unitsText,
    '</COVERED_UNITS>',
    '',
    '<SHAPE_CONTRACT>',
    `shape = ${planBlock.shape} → content.type = ${SHAPE_HINT[planBlock.shape] || '?'}`,
    '',
    catalog,
    '</SHAPE_CONTRACT>',
    '',
    '<SOURCE_EXCERPTS>',
    excerptText,
    '</SOURCE_EXCERPTS>',
    '',
    ...(BLOCK_GUIDANCE[planBlock.id] ? [BLOCK_GUIDANCE[planBlock.id], ''] : []),
    '另外必须遵守：',
    '',
    '1. 每个"主要内容元素"（节点、单元格、差异行、梯度、步骤、组合、清单条目）都要带 `sourceUnitIds` 字段，',
    '   列出它承载的 sourceUnit id。这是机器检查语义覆盖的唯一依据 —— 漏了就会被判为语义丢失。',
    '2. `<BLOCK_PLAN>.covers` 里的**每一条** sourceUnit 都必须至少被一个元素的 `sourceUnitIds` 引用。',
    '3. 不要输出 block 的 id / title / stage / shape / covers / sourceRefs / reviewObjects / defaultExpanded ——',
    '   这些字段由程序注入，你输出它们会被判为"修改了 Plan"。',
    '',
    '现在输出 JSON：{"shape": "<shape>", "content": { ... }}。只输出 JSON。',
  ].join('\n');
}

const SHAPE_HINT = {
  prose: 'prose',
  flow: 'flow',
  'current-target-flow': 'flow',
  matrix: 'matrix',
  'capability-matrix': 'matrix',
  diff: 'diff',
  ladder: 'ladder',
  walkthrough: 'steps',
  combo: 'combo',
  checklist: 'checklist',
  'two-column-comparison': 'checklist',
};

/**
 * 逐块的"视觉拓扑"提示（控制级，不改变语义）。
 *
 * 为什么需要：flow 契约里每个 lane 是**线性**的 `nodes[]`，一个 node 后只能跟一条 edge。
 * 因此"Frozen Context 同时有两条去向"这种分支拓扑只能靠 `tier: "secondary"`
 * （renderer 会把该节点缩进渲染）表达。实测中模型会把第二条路径塞进 `edge.note`，
 * 结果"只看图看不出分支"。这里只说明**用什么结构表达分支**，不替它决定语义内容。
 */
const BLOCK_GUIDANCE = {
  'O-04': [
    '**本块的视觉拓扑要求（当前 lane 必须能"只看图"看出分支）**',
    '',
    'flow 契约里每个 lane 的 `nodes[]` 是线性序列，因此分支必须用 `tier` 表达：',
    '',
    '- **主路径**：`tier` 省略（或 `"primary"`）—— 例如 `Frozen Context` → `outline route`；',
    '- **派生路径**：`tier: "secondary"` —— 从主干分出去的路径，renderer 会把它缩进渲染，形成看得见的旁支；',
    '- **不要把一条独立路径只写进 `edge.note`** —— edge.note 只是主干上的过渡说明，承载不了一条路径。',
    '',
    '当前 lane 的期望阅读结果：主干 `Frozen Context → outline route`，',
    '并**另有一条缩进的旁支** `scene-content route` → `scene`；旁支第一个节点要写明它调用了',
    '`appendFormalTeachingPrompt()`（即"scene 也直接吃完整 context"）。',
    '目标 lane 的期望阅读结果：单一路径 `Frozen Context → outline generation → Outline Revision → scene`，没有旁支。',
  ].join('\n'),
};

/* ------------------------------------------------------------------ *
 * 调用模型（传输层重试；语义层不重试）
 * ------------------------------------------------------------------ */

async function callModel({ baseURL, apiKey, model }, systemPrompt, userMessage) {
  const timeoutMs = Number(args.timeoutMs) || DEFAULTS.timeoutMs;
  const maxAttempts = Number(args.maxAttempts) || DEFAULTS.maxAttempts;
  const body = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: Number(args.temperature),
    max_tokens: Number(args.maxTokens),
  });

  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    let text;
    try {
      response = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body,
        signal: controller.signal,
      });
      text = await response.text();
    } catch (error) {
      clearTimeout(timer);
      const isAbort = error.name === 'AbortError';
      const cause = error.cause ? `（cause: ${error.cause.code || error.cause.message}）` : '';
      lastError = new Error(isAbort ? `请求超时（> ${(timeoutMs / 1000).toFixed(0)}s）` : `${error.message}${cause}`);
      if (attempt < maxAttempts) {
        const waitMs = attempt * 5000;
        console.log(`  第 ${attempt} 次尝试失败：${lastError.message}；${waitMs / 1000}s 后重试…`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      break;
    }
    clearTimeout(timer);

    if (!response.ok) {
      const retryable = response.status >= 500 || response.status === 429;
      if (retryable && attempt < maxAttempts) {
        lastError = new Error(`HTTP ${response.status}`);
        console.log(`  第 ${attempt} 次尝试失败（HTTP ${response.status}），重试…`);
        await new Promise((r) => setTimeout(r, attempt * 5000));
        continue;
      }
      throw new Error(`HTTP ${response.status}：${text.slice(0, 500)}`);
    }

    let payload;
    try {
      payload = JSON.parse(text);
    } catch (error) {
      throw new Error(`响应不是 JSON：${text.slice(0, 300)}`);
    }
    const choice = (payload.choices || [])[0] || {};
    const content = (choice.message && choice.message.content) || '';
    const finishReason = choice.finish_reason || null;

    // 空 finish_reason 或 length 说明这次响应被上游截断（常因 reasoning tokens 吃满预算）。
    // 这是**传输/生成完整性问题**，不是模型语义错误，因此可以作为传输层重试；
    // 语义失败（check-block FAIL）依旧绝不重试。
    const truncated = finishReason === null || finishReason === 'length';
    if (truncated && attempt < maxAttempts) {
      lastError = new Error(`响应被截断（finish_reason=${finishReason || '(empty)'}，输出 ${content.length} 字符）`);
      console.log(`  第 ${attempt} 次尝试响应被截断（finish_reason=${finishReason || 'empty'}）；${5 * attempt}s 后重试…`);
      await new Promise((r) => setTimeout(r, attempt * 5000));
      continue;
    }

    return {
      content,
      usage: payload.usage || null,
      latencyMs: Date.now() - started,
      finishReason,
      truncated,
      attempt,
    };
  }
  throw new Error(`连续 ${maxAttempts} 次传输失败：${lastError ? lastError.message : '未知'}`);
}

function extractJson(content) {
  if (!content || !content.trim()) throw new Error('模型返回空内容');
  let text = content.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first < 0 || last <= first) throw new Error(`找不到 JSON：${text.slice(0, 200)}`);
  return JSON.parse(text.slice(first, last + 1));
}

/* ------------------------------------------------------------------ *
 * 单个 block 的处理
 * ------------------------------------------------------------------ */

async function runBlock(blockId, ctx) {
  const { plan, design, credentials, template, catalog, sourceSections, planSha, unitsSha } = ctx;
  const planBlock = plan.blocks.find((b) => b.id === blockId);
  if (!planBlock) throw new Error(`plan 里没有 block ${blockId}`);

  const unitById = new Map(plan.sourceUnits.map((u) => [u.id, u]));
  const units = planBlock.covers.map((id) => unitById.get(id)).filter(Boolean);
  const sections = [...new Set(planBlock.sourceRefs.map((r) => r.section))];
  const excerpts = sections
    .map((label) => sourceSections.sections.find((s) => s.label === label))
    .filter(Boolean);

  const userMessage = buildPrompt({ planBlock, units, excerpts, catalog, template });
  const outDir = path.join(ROOT, args.outDir, blockId);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`\n=== ${blockId}｜shape=${planBlock.shape}｜covers=${units.length} units｜sections=${sections.join(',')} ===`);
  console.log(`  ${planBlock.title}`);
  console.log(`  prompt ${(userMessage.length / 1024).toFixed(1)} KB`);

  const requestRecord = {
    stage: 2,
    blockId,
    model: credentials.model,
    endpoint: credentials.baseURL,
    temperature: Number(args.temperature),
    maxTokens: Number(args.maxTokens),
    shape: planBlock.shape,
    covers: planBlock.covers,
    expectedContentType: SHAPE_HINT[planBlock.shape],
    promptPath: path.relative(ROOT, path.resolve(ROOT, args.prompt)).replace(/\\/g, '/'),
    promptSha256: sha(template),
    userMessageSha256: sha(userMessage),
    planSha256: planSha,
    sourceUnitsSha256: unitsSha,
    designRef: design.design.id,
    startedAt: new Date().toISOString(),
    userMessageChars: userMessage.length,
  };

  let result;
  try {
    result = await callModel(credentials, template, userMessage);
  } catch (error) {
    fs.writeFileSync(path.join(outDir, 'request.json'), `${JSON.stringify({ ...requestRecord, error: error.message }, null, 2)}\n`, 'utf8');
    console.log(`  ✗ 调用失败：${error.message}`);
    return { blockId, failed: true, reason: error.message };
  }

  console.log(`  完成 ${(result.latencyMs / 1000).toFixed(0)}s｜finish=${result.finishReason || '(empty)'}${result.truncated ? '｜被截断' : ''}`);
  fs.writeFileSync(path.join(outDir, 'raw.md'), result.content, 'utf8');

  let aiResult;
  try {
    aiResult = extractJson(result.content);
  } catch (error) {
    fs.writeFileSync(
      path.join(outDir, 'request.json'),
      `${JSON.stringify(
        {
          ...requestRecord,
          parseError: error.message,
          truncated: !!result.truncated,
          finishReason: result.finishReason,
          usage: result.usage,
          rawChars: result.content.length,
        },
        null,
        2
      )}\n`,
      'utf8'
    );
    console.log(`  ✗ 解析失败：${error.message}`);
    return { blockId, failed: true, reason: `parse: ${error.message}`, truncated: !!result.truncated };
  }

  // 程序注入固定字段 —— AI 无法修改 Plan
  const assembled = {
    id: planBlock.id,
    title: planBlock.title,
    stage: planBlock.stage,
    shape: planBlock.shape,
    covers: planBlock.covers,
    sourceRefs: planBlock.sourceRefs,
    reviewObjects: planBlock.reviewObjects,
    defaultExpanded: planBlock.defaultExpanded,
    content: aiResult.content,
  };
  if (aiResult.shape && aiResult.shape !== planBlock.shape) {
    assembled.__shapeMismatch = { fromAI: aiResult.shape, fromPlan: planBlock.shape };
  }

  const blockFile = path.join(outDir, 'block.generated.json');
  fs.writeFileSync(blockFile, `${JSON.stringify(assembled, null, 2)}\n`, 'utf8');
  fs.writeFileSync(
    path.join(outDir, 'request.json'),
    `${JSON.stringify(
      {
        ...requestRecord,
        finishedAt: new Date().toISOString(),
        usage: result.usage,
        latencyMs: result.latencyMs,
        finishReason: result.finishReason,
        attempt: result.attempt,
        aiReturnedShape: aiResult.shape || null,
        aiWarnings: Array.isArray(aiResult._warnings) ? aiResult._warnings : null,
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  // check-block
  let checkOut = '';
  let checkCode = 0;
  try {
    checkOut = execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'check-block.js'), blockFile, '--plan', path.resolve(ROOT, args.plan)], {
      encoding: 'utf8',
    });
  } catch (error) {
    checkOut = `${error.stdout || ''}${error.stderr || ''}`;
    checkCode = error.status === undefined ? 1 : error.status;
  }
  fs.writeFileSync(path.join(outDir, 'check-block.txt'), checkOut, 'utf8');

  const coverageLine = (checkOut.match(/coverage .*/) || [''])[0].trim();
  console.log(`  ${checkCode === 0 ? '✓' : '✗'} ${coverageLine}`);
  return { blockId, failed: false, checkCode, checkOut, coverage: coverageLine, shape: planBlock.shape };
}

/* ------------------------------------------------------------------ *
 * 主流程
 * ------------------------------------------------------------------ */

async function main() {
  const credentials = resolveCredentials();
  const planRaw = fs.readFileSync(path.resolve(ROOT, args.plan), 'utf8');
  const plan = JSON.parse(planRaw);
  const design = JSON.parse(fs.readFileSync(path.resolve(ROOT, args.design), 'utf8'));
  const catalog = fs.readFileSync(path.resolve(ROOT, args.catalog), 'utf8');
  const sourceSections = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'source-sections.json'), 'utf8'));

  const promptRaw = fs.readFileSync(path.resolve(ROOT, args.prompt), 'utf8');
  const systemStart = promptRaw.indexOf('## SYSTEM');
  const template = (systemStart >= 0 ? promptRaw.slice(systemStart + '## SYSTEM'.length) : promptRaw).trim();

  const unitsRaw = JSON.stringify(plan.sourceUnits);
  const ctx = {
    plan,
    design,
    credentials,
    template,
    catalog,
    sourceSections,
    planSha: sha(planRaw),
    unitsSha: sha(unitsRaw),
  };

  const blockIds = args.select
    ? selectPilotBlocks(plan)
    : args.all
      ? plan.blocks.map((b) => b.id)
      : String(args.block || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

  if (blockIds.length === 0) {
    console.error('用法：npm run ai:block -- --block O-04  或  --select  或  --all');
    process.exit(2);
  }

  console.log('=== Stage 2 runner ===');
  console.log(`model      ${credentials.model}`);
  console.log(`plan       ${path.relative(ROOT, path.resolve(ROOT, args.plan))}（sha ${ctx.planSha}）`);
  console.log(`prompt     ${path.relative(ROOT, path.resolve(ROOT, args.prompt))}（sha ${ctx.promptSha256 || sha(template)}）`);
  console.log(`blocks     ${blockIds.join(', ')}`);
  if (args.select) {
    console.log('选择依据   每类 shape 中"unit 数 × core 数 × kind 丰富度 × 章节跨度"得分最高者');
  }

  const results = [];
  for (const id of blockIds) {
    // eslint-disable-next-line no-await-in-loop
    const r = await runBlock(id, ctx);
    results.push(r);
  }

  console.log('\n=== 汇总 ===');
  results.forEach((r) => {
    if (r.failed) console.log(`  ${r.blockId.padEnd(6)} 调用失败：${r.reason}`);
    else console.log(`  ${r.blockId.padEnd(6)} ${r.shape.padEnd(22)} ${r.checkCode === 0 ? 'PASS' : 'FAIL'}  ${r.coverage}`);
  });
  fs.writeFileSync(
    path.join(ROOT, args.outDir, 'pilot-summary.json'),
    `${JSON.stringify(
      {
        model: credentials.model,
        planSha256: ctx.planSha,
        sourceUnitsSha256: ctx.unitsSha,
        promptSha256: sha(template),
        selectedBy: args.select ? 'structural-selector-v1' : 'explicit',
        results: results.map((r) => ({
          blockId: r.blockId,
          shape: r.shape || null,
          failed: !!r.failed,
          reason: r.reason || null,
          checkBlock: r.checkCode === undefined ? null : r.checkCode === 0 ? 'PASS' : 'FAIL',
          coverage: r.coverage || null,
        })),
      },
      null,
      2
    )}\n`,
    'utf8'
  );
  console.log(`\n产物目录：${path.relative(ROOT, path.join(ROOT, args.outDir))}/<block-id>/`);
}

main().catch((error) => {
  console.error(`✗ 未预期错误：${error.stack || error.message}`);
  process.exit(1);
});
