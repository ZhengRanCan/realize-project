#!/usr/bin/env node
'use strict';

/**
 * 最小 AI test runner —— 只跑 Stage 1（Semantic Coverage Planning）。
 *
 * 定位：一个**观察工具**，不是产品代码。它不做自动重试、不做多轮修正、不入 Electron。
 * 一次调用 = 一次生成 + 一次 check-plan，然后落盘全部原始产物供人工比对。
 *
 * 用法：
 *   npm run ai:plan -- --doc 测试文档/18-context-consumption-semantic-model.md
 *   npm run ai:plan -- --run 1 --model gpt-5.6-sol
 *
 * 凭据解析顺序（绝不写入仓库、绝不打印完整 key）：
 *   1. 环境变量 OVERVIEW_PLAN_API_KEY / OVERVIEW_PLAN_BASE_URL / OVERVIEW_PLAN_MODEL
 *   2. DSH settings.yaml 里 dsh-imagegen.apiKey / apiUrl（本机已有的 OpenAI 兼容网关）
 */

// Node 内置的 fetch 走 undici，其默认 headers timeout 是 5 分钟 —— 比本 runner 自己的
// AbortController 预算短。长响应（本任务约 3–5 分钟）会先被 undici 掐断成
// UND_ERR_HEADERS_TIMEOUT，所以这两个环境变量必须在 undici 加载前设置。
// 注意：这是**传输层**超时，与"语义层不自动重试"的约束无关。
process.env.UNDICI_HEADERS_TIMEOUT = process.env.UNDICI_HEADERS_TIMEOUT || '900000';
process.env.UNDICI_BODY_TIMEOUT = process.env.UNDICI_BODY_TIMEOUT || '900000';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

const DEFAULTS = {
  doc: path.join('测试文档', '18-context-consumption-semantic-model.md'),
  design: path.join('fixtures', 'context-consumption.json'),
  prompt: path.join('ai', 'stage1-plan.prompt.md'),
  schema: path.join('schema', 'overview-plan.schema.json'),
  catalog: path.join('docs', 'shape-catalog.md'),
  sections: path.join('docs', 'source-sections.json'),
  outDir: 'tmp',
  model: 'gpt-5.6-sol',
  maxTokens: 32000,
  temperature: 1,
  timeoutMs: 900000,
};

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
    if (value === undefined || value.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = value;
      i += 1;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const docPath = path.resolve(ROOT, args.doc);
const designPath = path.resolve(ROOT, args.design);
const promptPath = path.resolve(ROOT, args.prompt);
const outDir = path.resolve(ROOT, args.outDir);
const runLabel = args.run ? `run-${args.run}` : `run-${Date.now()}`;

/* ------------------------------------------------------------------ *
 * 凭据
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
    console.error('✗ 找不到可用的 API 凭据。');
    console.error('  请设置 OVERVIEW_PLAN_BASE_URL / OVERVIEW_PLAN_API_KEY，');
    console.error('  或确保 ~/.dsh/settings.yaml 里有 apiUrl 与 apiKey。');
    process.exit(2);
  }
  return { baseURL: baseURL.replace(/\/$/, ''), apiKey, model };
}

/* ------------------------------------------------------------------ *
 * Prompt 组装
 * ------------------------------------------------------------------ */

function loadPromptTemplate() {
  const raw = fs.readFileSync(promptPath, 'utf8');
  // 取 ## SYSTEM 之后、## 输入说明 之前的正文；占位符在运行时替换
  const systemStart = raw.indexOf('## SYSTEM');
  const body = systemStart >= 0 ? raw.slice(systemStart + '## SYSTEM'.length) : raw;
  return body.trim();
}

function buildUserMessage(template) {
  const docSections = JSON.parse(fs.readFileSync(path.resolve(ROOT, args.sections), 'utf8'));
  const schema = fs.readFileSync(path.resolve(ROOT, args.schema), 'utf8');
  const catalog = fs.readFileSync(path.resolve(ROOT, args.catalog), 'utf8');
  const design = JSON.parse(fs.readFileSync(designPath, 'utf8'));

  const sectionsText = docSections.sections
    .map((s) => `### ${s.label} ${s.title}（原文 L${s.startLine}-${s.endLine}）\n\n${s.text}`)
    .join('\n\n');

  const reviewObjects = [
    ...design.decisions.map((d) => `${d.id}（Decision / ${d.reviewLevel} / ${d.status}）：${d.title}`),
    ...design.facts.map((f) => `${f.id}（Fact）：${f.statement.slice(0, 60)}…`),
    ...design.gaps.map((g) => `${g.id}（Gap / ${g.severity}）：${g.title}`),
    ...design.openQuestions.map((q) => `${q.id}（OpenQuestion / ${q.category}）：${q.question}`),
  ].join('\n');

  return [
    template,
    '',
    '---',
    '',
    '# 本次输入',
    '',
    `designRef.id = ${design.design.id}`,
    `designRef.path = ${path.relative(ROOT, designPath).replace(/\\/g, '/')}`,
    '',
    '<REVIEW_OBJECTS>',
    reviewObjects,
    '</REVIEW_OBJECTS>',
    '',
    '<SCHEMA>',
    schema,
    '</SCHEMA>',
    '',
    '<SHAPE_CATALOG>',
    catalog,
    '</SHAPE_CATALOG>',
    '',
    '<DOC_SECTIONS>',
    sectionsText,
    '</DOC_SECTIONS>',
    '',
    '现在输出完整的 overview-plan JSON。只输出 JSON。',
  ].join('\n');
}

/* ------------------------------------------------------------------ *
 * 调用模型
 * ------------------------------------------------------------------ */

/**
 * 调用模型。
 *
 * 区分两类重试：
 * - **传输层重试**（本函数）：网络超时 / 429 / 5xx 属于基础设施抖动，与模型语义无关，重试是安全的。
 * - **语义层重试**（刻意不做）：check-plan 失败后自动改 prompt 重跑，会污染"观察真实模型行为"，
 *   因此 runner 只做"生成一次 + check-plan 一次"。
 */
async function callModel({ baseURL, apiKey, model }, systemPrompt, userMessage) {
  const timeoutMs = Number(args.timeoutMs) || DEFAULTS.timeoutMs;
  const maxAttempts = 3;
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
      // 只在这里处理**传输层**失败；下面 HTTP 层的错误不经过这个 catch。
      clearTimeout(timer);
      const isAbort = error.name === 'AbortError';
      const cause = error.cause ? `（cause: ${error.cause.code || error.cause.message}）` : '';
      lastError = new Error(isAbort ? `请求超时（> ${(timeoutMs / 1000).toFixed(0)}s）` : `${error.message}${cause}`);
      if (attempt < maxAttempts) {
        const waitMs = attempt * 5000;
        console.log(`  第 ${attempt} 次尝试失败：${lastError.message}；${waitMs / 1000}s 后重试…`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      break;
    }
    clearTimeout(timer);

    if (!response.ok) {
      const retryable = response.status >= 500 || response.status === 429;
      const detail = `HTTP ${response.status}：${text.slice(0, 600)}`;
      if (retryable && attempt < maxAttempts) {
        lastError = new Error(`HTTP ${response.status}`);
        console.log(`  第 ${attempt} 次尝试失败（HTTP ${response.status}），重试…`);
        await new Promise((resolve) => setTimeout(resolve, attempt * 5000));
        continue;
      }
      // 4xx（除 429）是确定性错误：额度不足、参数错误、鉴权失败等，重试没有意义 → 立即失败。
      throw new Error(detail);
    }

    let payload;
    try {
      payload = JSON.parse(text);
    } catch (error) {
      throw new Error(`响应不是 JSON：${text.slice(0, 400)}`);
    }
    const choice = (payload.choices || [])[0] || {};
    const content = (choice.message && choice.message.content) || '';
    return {
      content,
      usage: payload.usage || null,
      latencyMs: Date.now() - started,
      finishReason: choice.finish_reason,
      attempt,
    };
  }
  throw new Error(
    `连续 ${maxAttempts} 次传输失败：${lastError ? lastError.message : '未知'}` +
      `；请求体约 ${(userMessage.length / 1024).toFixed(1)} KB。`
  );
}

/** 从模型输出里抠出 JSON（容忍 ```json 围栏与前后解释文字）。 */
function extractJson(content) {
  if (!content || !content.trim()) throw new Error('模型返回了空内容');
  let text = content.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first < 0 || last <= first) throw new Error(`找不到 JSON 对象：${text.slice(0, 300)}`);
  return JSON.parse(text.slice(first, last + 1));
}

/* ------------------------------------------------------------------ *
 * 主流程
 * ------------------------------------------------------------------ */

async function main() {
  const credentials = resolveCredentials();
  fs.mkdirSync(outDir, { recursive: true });

  const template = loadPromptTemplate();
  const userMessage = buildUserMessage(template);

  console.log('=== Stage 1 run ===');
  console.log(`document   ${path.relative(ROOT, docPath)}`);
  console.log(`prompt     ${path.relative(ROOT, promptPath)}`);
  console.log(`model      ${credentials.model}`);
  console.log(`endpoint   ${credentials.baseURL}`);
  console.log(`run label  ${runLabel}`);
  console.log(`prompt 大小 ${(userMessage.length / 1024).toFixed(1)} KB（约 ${Math.round(userMessage.length / 3.2)} tokens）`);

  // 原始请求留档（不含 key）
  const requestRecord = {
    runLabel,
    model: credentials.model,
    endpoint: credentials.baseURL,
    temperature: Number(args.temperature),
    maxTokens: Number(args.maxTokens),
    docPath: path.relative(ROOT, docPath).replace(/\\/g, '/'),
    promptPath: path.relative(ROOT, promptPath).replace(/\\/g, '/'),
    // prompt 指纹：用来确认"跨 run 用的是同一版 prompt"，让比较可验证
    promptSha256: require('node:crypto').createHash('sha256').update(template).digest('hex').slice(0, 16),
    userMessageSha256: require('node:crypto').createHash('sha256').update(userMessage).digest('hex').slice(0, 16),
    startedAt: new Date().toISOString(),
    systemPromptChars: template.length,
    userMessageChars: userMessage.length,
  };

  console.log('\n调用模型…');
  let result;
  try {
    result = await callModel(credentials, template, userMessage);
  } catch (error) {
    fs.writeFileSync(
      path.join(outDir, `context-consumption.${runLabel}.request.json`),
      `${JSON.stringify({ ...requestRecord, error: error.message }, null, 2)}\n`,
      'utf8'
    );
    console.error(`\n✗ 调用失败：${error.message}`);
    process.exit(1);
  }

  console.log(`完成：${(result.latencyMs / 1000).toFixed(1)}s，finish_reason=${result.finishReason}`);
  if (result.usage) {
    console.log(
      `tokens：prompt ${result.usage.prompt_tokens} / completion ${result.usage.completion_tokens} / total ${result.usage.total_tokens}`
    );
  }

  // 落盘原始输出
  const rawFile = path.join(outDir, `context-consumption.${runLabel}.raw.md`);
  fs.writeFileSync(rawFile, result.content, 'utf8');

  let plan;
  try {
    plan = extractJson(result.content);
  } catch (error) {
    fs.writeFileSync(
      path.join(outDir, `context-consumption.${runLabel}.request.json`),
      `${JSON.stringify({ ...requestRecord, usage: result.usage, latencyMs: result.latencyMs, parseError: error.message }, null, 2)}\n`,
      'utf8'
    );
    console.error(`\n✗ 无法解析模型输出为 JSON：${error.message}`);
    console.error(`  原始输出已保存：${path.relative(ROOT, rawFile)}`);
    process.exit(1);
  }

  const planFile = path.join(outDir, `context-consumption.${runLabel}.overview-plan.json`);
  fs.writeFileSync(planFile, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  fs.writeFileSync(
    path.join(outDir, `context-consumption.${runLabel}.request.json`),
    `${JSON.stringify(
      {
        ...requestRecord,
        finishedAt: new Date().toISOString(),
        usage: result.usage,
        latencyMs: result.latencyMs,
        finishReason: result.finishReason,
        sourceUnits: Array.isArray(plan.sourceUnits) ? plan.sourceUnits.length : null,
        blocks: Array.isArray(plan.blocks) ? plan.blocks.length : null,
        duplicatesMerged: Array.isArray(plan.duplicatesMerged) ? plan.duplicatesMerged.length : null,
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  console.log(`\n已写出 ${path.relative(ROOT, planFile)}`);

  // 自动跑 check-plan（失败不重试，只报告）
  console.log('\n--- check-plan ---');
  let checkOutput = '';
  let checkCode = 0;
  try {
    checkOutput = execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'check-plan.js'), planFile], {
      encoding: 'utf8',
    });
  } catch (error) {
    checkOutput = `${error.stdout || ''}${error.stderr || ''}`;
    checkCode = error.status === undefined ? 1 : error.status;
  }
  process.stdout.write(checkOutput);
  fs.writeFileSync(path.join(outDir, `context-consumption.${runLabel}.check-plan.txt`), checkOutput, 'utf8');

  console.log(`\n本 run 结果：${checkCode === 0 ? '通过（见上方 warning）' : 'FAIL'}`);
  console.log('说明：本 runner 不做自动重试。失败信息请人工观察后决定如何调整 prompt。');
  process.exit(0);
}

main().catch((error) => {
  console.error(`✗ 未预期错误：${error.stack || error.message}`);
  process.exit(1);
});
