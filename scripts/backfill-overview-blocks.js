#!/usr/bin/env node
'use strict';

/**
 * 为收缩版 MVP 的「方案总览」补上视觉层数据（overview）。
 *
 * 依据：docs/overview-coverage.md 的 O-01 ~ O-14 覆盖表。
 * 原则：重要语义不得因可视化重述而丢失；允许通过层级、折叠降低同时出现的信息量。
 *       验收标准 = 语义覆盖，不要求句子覆盖。
 *
 * 注意：区块里**不写"为什么这样设计 UI"的解释性文案** —— 那是开发说明，
 * 进入产品后只应留下内容本身（标题 + 内容）。解释留在 docs/overview-coverage.md。
 *
 * 幂等：重复运行会把 overview 覆盖成同一份内容。
 *
 * 用法：node scripts/backfill-overview-blocks.js
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE = path.join(ROOT, 'fixtures', 'context-consumption.json');

/* ------------------------------------------------------------------ *
 * 甲 · 这是什么
 * ------------------------------------------------------------------ */

const O01 = {
  id: 'O-01',
  title: '这是什么文档',
  stage: 'what',
  role: 'ambient',
  sources: ['§0', '§15'],
  defaultExpanded: true,
  reviewObjects: ['DEC-012'],
  content: {
    type: 'prose',
    parts: [
      {
        text: '本文只确定 Context Consumption 的产品语义层级：把"课前教学上下文有没有被真正用上"拆成三个可分别判定的状态。',
        variant: 'lead',
      },
      {
        text: '它不是 Feature 合同、不是架构 SSOT、不是最终 schema，也不构成实现授权。因此本文里的"目标"描述都还没有实现，需要人工逐条批准后才能进入实现。',
        variant: 'secondary',
      },
    ],
  },
};

const O02 = {
  id: 'O-02',
  title: '核心主张：保留三级递进',
  stage: 'what',
  sources: ['§1'],
  defaultExpanded: true,
  reviewObjects: ['DEC-001'],
  content: {
    type: 'ladder',
    caption: '三个层级各自表示什么（不能互相替代）',
    tiers: [
      {
        label: 'Context Receipt',
        text: '上下文到达了系统',
        detail: '至少可以识别它属于某个请求或 session lineage；不代表可用，也不代表已使用。',
        variant: 'info',
      },
      {
        label: 'Context Availability',
        text: '合法、冻结、版本一致的上下文已经可以被本次生成使用',
        detail: '只说明"如果生成器需要，它现在可以合法、稳定地使用这份上下文"。',
        variant: 'info',
      },
      {
        label: 'Context Consumption',
        text: '本次生成任务实际把其中的教学语义作为课程设计输入',
        detail: '不是仅仅收到、保存或附加了上下文。',
        variant: 'ok',
      },
    ],
    note: 'Receipt ≠ Availability，Availability ≠ Consumption。',
  },
};

const O03 = {
  id: 'O-03',
  title: '明确不采用：把 Context Influence 作为第四级',
  stage: 'what',
  sources: ['§1', '§6'],
  defaultExpanded: true,
  reviewObjects: ['DEC-002'],
  content: {
    type: 'diff',
    sides: [
      {
        label: '被考虑过的四级结构（不采用）',
        variant: 'current',
        lines: [
          { mark: 'keep', text: 'Receipt → Availability → Consumption' },
          {
            mark: 'gone',
            text: 'Influence："生成结果出现可归因于 DeepTutor 上下文的变化或取舍"',
            note: '超出 Consumption 的产品责任',
          },
        ],
      },
      {
        label: '本次采用（三级为止）',
        variant: 'target',
        lines: [
          { mark: 'keep', text: 'Receipt → Availability → Consumption' },
          {
            mark: 'add',
            text: 'Influence 只能作为未来研究或实验评估中的独立问题，不作为本协议的必要产品状态',
          },
        ],
      },
    ],
    note: '理由与反例见 O-12：要证明"可归因于"需要反事实比较与控制变量。',
  },
};

const O04 = {
  id: 'O-04',
  title: '系统骨架：消费点放在哪一层',
  stage: 'what',
  sources: ['§9', '§10', '§13', '§14'],
  defaultExpanded: true,
  reviewObjects: ['DEC-007', 'DEC-008', 'DEC-011', 'FACT-001', 'FACT-002', 'FACT-003', 'FACT-005'],
  content: {
    type: 'flow',
    caption: '(a) 主运行链：现状 vs 目标',
    lanes: [
      {
        label: '现在',
        variant: 'current',
        nodes: [
          {
            node: {
              title: 'Frozen Context',
              detail: 'freezeFormalFusionForOutline() / resolveFormalFusion()',
              state: 'current',
              badges: ['DEC-011', 'FACT-001'],
            },
            edge: { kind: 'plain' },
          },
          {
            node: {
              title: 'outline route',
              detail: 'app/api/generate/scene-outlines-stream/route.ts：解析请求、恢复冻结上下文、追加 projection、调用 outline LLM stream、持久化',
              state: 'current',
              badges: ['DEC-011', 'FACT-001'],
            },
            edge: { kind: 'problem', note: 'scene 也直接吃完整 context' },
          },
          {
            node: {
              title: 'scene-content route',
              detail: '恢复服务器存储的 outline 后，仍调用 appendFormalTeachingPrompt() 直接附加 formal context',
              state: 'changed',
              tier: 'secondary',
              badges: ['DEC-008', 'GAP-001', 'FACT-003'],
            },
            edge: { kind: 'problem', note: '每个 scene 有机会独立重新解释整份 guidance' },
          },
          {
            node: {
              title: 'scene',
              detail: 'SceneGenerationContext 是跨页 speech coherence context，不是 DeepTutor 的 Frozen Context',
              state: 'changed',
              tier: 'secondary',
              badges: ['FACT-004'],
            },
          },
        ],
      },
      {
        label: '目标',
        variant: 'target',
        nodes: [
          {
            node: {
              title: 'Frozen Context',
              detail: '同一份冻结上下文，版本一致、lineage 一致',
              state: 'target',
            },
            edge: { kind: 'changed', note: '消费点收敛到 outline generation' },
          },
          {
            node: {
              title: 'outline generation',
              detail: 'generation projection → outline prompt / planner → Outline Generation Attempt → 持久化',
              state: 'changed',
              badges: ['DEC-007', 'DEC-009', 'GAP-005'],
            },
            edge: { kind: 'plain' },
          },
          {
            node: {
              title: 'context-shaped Outline Revision',
              detail: '生成成功并被接受后形成的课纲版本',
              state: 'target',
              badges: ['DEC-009'],
            },
            edge: { kind: 'changed', note: '只继承，不重读' },
          },
          {
            node: {
              title: 'scene',
              detail: '只继承 context lineage、outline revision 与 outline 派生的局部约束；不重读 raw Proposal、learner projection 或另一个 context revision',
              state: 'changed',
              badges: ['DEC-008', 'GAP-001'],
            },
          },
        ],
      },
    ],
  },
};

const O04b = {
  id: 'O-04b',
  title: '为什么不把消费点放在 scene',
  stage: 'what',
  sources: ['§13'],
  defaultExpanded: false,
  reviewObjects: ['DEC-007'],
  content: {
    type: 'checklist',
    panels: [
      {
        title: '若让每个 scene generator 独立直接消费完整 Frozen Context，会造成（§13 原文代价）',
        variant: 'bad',
        items: [
          { text: '每个 scene 重新解释同一份 guidance', variant: 'bad' },
          { text: 'scene 之间可能使用不同 context revision', variant: 'bad' },
          { text: 'scene 层决定覆盖 outline 层的整体课程设计', variant: 'bad' },
          { text: 'learner / context 数据重复进入多个 Prompt', variant: 'bad' },
          { text: 'token 成本增加', variant: 'bad' },
          { text: '后续 realized alignment 难以判断偏差来自 outline 还是 scene', variant: 'bad' },
        ],
      },
      {
        title: '因此 scene pipeline 的定位是',
        variant: 'ok',
        items: [
          { text: '实现已经产生的 outline，而不是重新决定整节课的目标、知识范围和教学顺序', variant: 'ok' },
          { text: '主要消费对象是 context-shaped outline，而不是完整 Frozen Context', variant: 'ok' },
        ],
      },
    ],
  },
};

const O04c = {
  id: 'O-04c',
  title: '三个产品层级 → 现有生产职责映射',
  stage: 'what',
  sources: ['§10', '§14'],
  defaultExpanded: false,
  reviewObjects: ['DEC-011', 'DEC-003'],
  content: {
    type: 'matrix',
    columns: ['产品层级', 'OpenMAIC 生产职责', '当前代码对应的概念入口', '成功边界'],
    rows: [
      [
        { text: 'Context Receipt' },
        { text: '接收和记录课前 context lineage' },
        { text: 'freezeFormalFusionForOutline() / resolveFormalFusion() 及 session store' },
        { text: '服务端收到并能关联 context/request/session；不代表可用或已消费', variant: 'warn' },
      ],
      [
        { text: 'Context Availability' },
        { text: '在当前 outline attempt 中恢复合法、冻结、版本一致 context' },
        { text: 'resolveFormalFusion()、contextFrom()、正式 Fusion session recovery' },
        { text: '当前生成可安全读取同一 Frozen Context；不代表 generator 已使用', variant: 'warn' },
      ],
      [
        { text: 'Context Consumption' },
        { text: '将冻结语义投影到 outline generation 并作为课程设计输入' },
        { text: 'projectFormalGenerationContext()、appendFormalTeachingPrompt()、outline route / generator orchestration' },
        { text: '当前 Outline Generation Attempt 实际使用 generation-facing teaching semantics', variant: 'ok' },
      ],
    ],
    note:
      '这张表说明未来 Feature 应该沿现有职责边界改造，不表示现有函数已经满足最终产品验收（对应 DEC-011）。' +
      'Consumption 侧主要改造 generation-session / context projection / outline route / orchestration 与 attempt、revision lineage；' +
      'Output Alignment 侧则是新增 outline preflight assessment、scene realization assessment 等（对应 DEC-003）。',
  },
};

/* ------------------------------------------------------------------ *
 * 乙 · 它怎么跑
 * ------------------------------------------------------------------ */

const O05 = {
  id: 'O-05',
  title: '两条链：Context-side 与 Output-side',
  stage: 'how',
  sources: ['§2', '§3', '§4', '§7', '§8'],
  defaultExpanded: true,
  reviewObjects: ['DEC-003'],
  content: {
    type: 'flow',
    caption: '两条相互关联但不互相吞并的链',
    lanes: [
      {
        label: 'Context-side chain',
        variant: 'current',
        nodes: [
          { node: { title: 'Context Receipt', detail: '上下文到达了系统', state: 'current' }, edge: { kind: 'plain' } },
          { node: { title: 'Context Availability', detail: '合法冻结版本一致，可供本次生成使用', state: 'current' }, edge: { kind: 'plain' } },
          { node: { title: 'Context Consumption', detail: '教学语义实际参与生成', state: 'current' } },
        ],
      },
      {
        label: 'Output-side chain',
        variant: 'target',
        nodes: [
          { node: { title: 'Generated Lesson', detail: '最终生成的 outline 与 scene', state: 'target' }, edge: { kind: 'plain' } },
          { node: { title: 'Output Alignment', detail: '在可观察意义上体现了相关目标、知识范围与教学设计要求', state: 'target' } },
        ],
      },
    ],
    note: '两条链共同支持 Context-grounded generation narrative；不承诺严格反事实因果。',
  },
};

const O06 = {
  id: 'O-06',
  title: '两条链各自回答什么（职责边界）',
  stage: 'how',
  sources: ['§2', '§8', '§14'],
  defaultExpanded: true,
  reviewObjects: ['DEC-003'],
  content: {
    type: 'matrix',
    columns: ['层级', '它只负责回答', '它不能替你回答'],
    rows: [
      [
        { text: 'Context Consumption', variant: 'plain' },
        { text: '本次生成使用了什么：一次 Outline Generation Attempt 使用了哪个 Frozen Context 和哪个 generation-facing projection' },
        { text: '最终课程是否体现了教学要求（那是 Output Alignment）' },
      ],
      [
        { text: 'Output Alignment', variant: 'plain' },
        { text: '生成出来的 outline 和 scene 体现了什么：objective / knowledge-scope / guidance 的局部判断与可定位 Evidence' },
        { text: '这些体现是否由 DeepTutor 造成（属于被排除的 Influence）' },
      ],
      [
        { text: 'Context Receipt', variant: 'plain' },
        { text: '上下文到达了系统，并可关联到某个请求或 session lineage' },
        { text: '上下文是否合法、是否冻结、是否可用' },
      ],
      [
        { text: 'Context Availability', variant: 'plain' },
        { text: '在当前 attempt 中确实存在一份合法、冻结、版本一致、可被读取的上下文' },
        { text: '生成器是否真的用了它' },
      ],
    ],
    note: 'Consumption ≠ Output Alignment，两个方向都不能互相证明。',
  },
};

const O07 = {
  id: 'O-07',
  title: '三个层级分别能说明什么、不能说明什么',
  stage: 'how',
  sources: ['§3', '§4', '§5'],
  defaultExpanded: true,
  reviewObjects: ['DEC-004'],
  content: {
    type: 'matrix',
    columns: ['层级', '能说明', '不能说明'],
    rows: [
      [
        { text: 'Receipt', variant: 'plain' },
        {
          text:
            '收到了某个 Proposal、冻结上下文或相关传输结果；传输层或接收层记录了到达事实；' +
            '后续系统有机会继续进行授权、版本和语义关联检查',
          variant: 'ok',
        },
        {
          text:
            '已通过合法性校验；属于当前生成请求；已经冻结；当前生成一定可以使用它；' +
            '生成器实际读过或使用了其中的教学语义；最终 outline 或 scene 已经对齐',
          variant: 'bad',
        },
      ],
      [
        { text: 'Availability', variant: 'plain' },
        {
          text:
            '来自受信任的服务端路径（不是浏览器伪造）；当前请求、lesson session 和 Frozen Context lineage 一致；' +
            'schema、revision、digest、引用范围和授权关系通过必要检查；使用的是同一个冻结上下文；' +
            '本次生成时仍在有效生命周期内；生成阶段具有服务端访问能力',
          variant: 'ok',
        },
        {
          text:
            '生成器已经真正使用了上下文。它只说明"如果生成器需要，它现在可以合法、稳定地使用这份上下文"',
          variant: 'bad',
        },
      ],
      [
        { text: 'Consumption', variant: 'plain' },
        {
          text:
            '本次 outline generation 实际使用了冻结上下文中的教学语义，并将其作为课程设计输入，' +
            '而不是仅仅收到、保存或附加了上下文',
          variant: 'ok',
        },
        {
          text: '不能由"收到 / 保存 / 附加到 Prompt / Prompt 变长 / 生成成功"推出 —— 举证方式见 O-10',
          variant: 'bad',
        },
      ],
    ],
  },
};

const O08 = {
  id: 'O-08',
  title: '消费的对象是什么、不是什么',
  stage: 'how',
  sources: ['§5'],
  defaultExpanded: false,
  reviewObjects: ['DEC-007', 'DEC-006'],
  content: {
    type: 'matrix',
    columns: ['被消费的对象（语义与教学取向）', '不被消费的对象（实现细节与运行时指令）'],
    rows: [
      [
        { text: '当前课程学习目标', variant: 'ok' },
        { text: 'sceneId', variant: 'bad' },
      ],
      [
        { text: '授权且相关的知识范围', variant: 'ok' },
        { text: 'route', variant: 'bad' },
      ],
      [
        { text: '必要前置关系', variant: 'ok' },
        { text: 'React 组件', variant: 'bad' },
      ],
      [
        { text: '与本课程相关的 learner projection', variant: 'ok' },
        { text: '播放器命令', variant: 'bad' },
      ],
      [
        { text: 'Required design constraints', variant: 'ok' },
        { text: 'checkpoint / remediation 创建命令', variant: 'bad' },
      ],
      [
        { text: 'Recommended approaches', variant: 'ok' },
        { text: 'RuntimeState 修改', variant: 'bad' },
      ],
      [
        { text: 'Evaluation Focus', variant: 'ok' },
        { text: '浏览器操作指令', variant: 'bad' },
      ],
    ],
    note: 'Consumption 不要求把 raw Proposal、DeepTutor 内部响应、工具轨迹或模型推理直接交给生成器。',
  },
};

/* ------------------------------------------------------------------ *
 * 丙 · 怎么算发生了
 * ------------------------------------------------------------------ */

const O09 = {
  id: 'O-09',
  title: 'Consumption 的定义与递进关系',
  stage: 'prove',
  sources: ['§5'],
  defaultExpanded: true,
  reviewObjects: ['DEC-005'],
  content: {
    type: 'ladder',
    caption: '三级递进各自在说什么',
    tiers: [
      { label: 'Receipt', text: '我们收到了上下文。', variant: 'info' },
      { label: 'Availability', text: '我们确认它合法、冻结、版本一致，并且本次生成可以使用。', variant: 'info' },
      { label: 'Consumption', text: '本次生成任务确实把其中的教学语义纳入了课程设计。', variant: 'ok' },
    ],
    note:
      '产品要求的是：教学语义成为 outline-design task 的真实输入，能够被生成过程用于组织目标、范围、顺序、活动和教学设计，' +
      '而不是装饰性文本或未使用附件。Prompt 可以是承载方式，但不是产品定义，也不是充分条件。',
  },
};

const O10 = {
  id: 'O-10',
  title: 'HOW DO WE KNOW：怎样证明某个状态真的发生了',
  stage: 'prove',
  sources: ['§3', '§4', '§5', '§11', '§12'],
  defaultExpanded: true,
  reviewObjects: ['DEC-005', 'DEC-010', 'Q-002'],
  content: {
    type: 'ladder',
    caption: '证据阶梯：每级状态需要哪一类证据',
    tiers: [
      {
        label: 'Receipt evidence',
        text: '到达记录',
        detail: '能关联到某个请求或 session lineage；传输层或接收层的到达事实被记录',
        variant: 'info',
      },
      {
        label: 'Availability evidence',
        text: '合法性证据',
        detail:
          'schema / revision / digest / 引用范围 / 授权 / lineage 一致性检查结果；确认使用的是同一个 Frozen Context',
        variant: 'info',
      },
      {
        label: 'Consumption evidence',
        text: 'generation-level 证据',
        detail:
          '某次 Outline Generation Attempt 使用了哪个 Frozen Context、哪个 generation-facing projection',
        variant: 'ok',
      },
    ],
  },
};

const O10b = {
  id: 'O-10b',
  title: '这些都不能单独证明 Consumption',
  stage: 'prove',
  sources: ['§5', '§12'],
  defaultExpanded: true,
  reviewObjects: ['DEC-010', 'GAP-004', 'GAP-005'],
  content: {
    type: 'checklist',
    panels: [
      {
        title: '不是充分证据（NOT sufficient on their own）',
        variant: 'bad',
        items: [
          { text: 'context stored', note: '上下文被保存了', variant: 'bad' },
          { text: 'context field exists', note: '生成请求参数里出现了一个 context 字段', variant: 'bad' },
          { text: 'prompt contains context', note: 'Prompt 里包含了上下文文本', variant: 'bad' },
          { text: 'generation succeeded', note: '生成接口成功返回了 outline', variant: 'bad' },
        ],
      },
      {
        title: '还有这些也同样不足以升级为 Consumption（§12 的七类代码情况）',
        variant: 'bad',
        items: [
          { text: 'freezeFormalFusionForOutline() 成功保存 frozenLessonGenerationContext，但 outline generation 没有读取其投影', variant: 'bad' },
          { text: 'resolveFormalFusion() 成功恢复 context，但生成器继续使用普通 requirements 和默认模板', variant: 'bad' },
          { text: 'projectFormalGenerationContext() 被调用，却只生成 lineage 元数据，没有转化为设计输入', variant: 'bad' },
          { text: 'appendFormalTeachingPrompt() 返回了含 context 文本的 Prompt，但 orchestration 没有要求依据这些语义设计', variant: 'bad' },
          { text: 'formal context 只出现在 scene-content prompt 中，而 outline generation 本身没有消费它', variant: 'bad' },
          { text: '浏览器提交的 outline / mapping / digest / guidance 与服务器 context 不一致，而服务端没有以存储值为权威', variant: 'bad' },
          { text: 'completeFormalLessonOutlines() 自动追加 checkpoint/remediation pair，但没有证明普通 outline generation 消费了教学语义', variant: 'bad' },
        ],
      },
      {
        title: '最低证据方向（原文只确定方向，未确定结构）',
        variant: 'ok',
        items: [
          { text: 'Frozen Context → Projection → Generation Attempt → Consumption Evidence', variant: 'ok' },
          {
            text: '证据结构本身仍是未决项（Q-002）：原文明确没有决定 evidence 的具体结构',
            variant: 'muted',
          },
        ],
      },
    ],
  },
};

const O10c = {
  id: 'O-10c',
  title: '两个反直觉判断',
  stage: 'prove',
  sources: ['§11', '§12'],
  defaultExpanded: true,
  reviewObjects: ['DEC-009'],
  content: {
    type: 'checklist',
    panels: [
      {
        title: '生成成功 ≠ 发生了 Consumption',
        variant: 'bad',
        items: [
          {
            text: '成功返回 outline 不能自动证明 Consumption',
            note: '如果 projection 没有成为真实生成输入，只能算 Receipt 或 Availability',
            variant: 'bad',
          },
        ],
      },
      {
        title: '生成失败 ≠ 没发生 Consumption',
        variant: 'ok',
        items: [
          {
            text: '最终生成失败时，Consumption 仍可能成立',
            note: '只要某一次实际 Attempt 已经合法使用了 generation-facing projection',
            variant: 'ok',
          },
        ],
      },
    ],
    note:
      'Consumption Subject 是 Frozen Context × Outline Generation Attempt；' +
      'Request 是一次服务端请求，Attempt 是请求中的一次实际生成尝试（可能有重试），Revision 是成功并被接受后形成的课纲版本。',
  },
};

const O11 = {
  id: 'O-11',
  title: 'Consumption 不要求什么 / 可能出现的不一致状态',
  stage: 'prove',
  sources: ['§5', '§8'],
  defaultExpanded: false,
  reviewObjects: ['DEC-005', 'DEC-006', 'DEC-003'],
  content: {
    type: 'checklist',
    panels: [
      {
        title: 'What Consumption does NOT require ①：不要求盲目服从',
        variant: 'plain',
        items: [
          {
            text: '某项 Recommended 被纳入设计考虑后最终没有被采用，仍可能满足 Consumption',
            note: '它会在 Output Alignment 中记录为 Not adopted，但不能伪称为已经采用',
            variant: 'ok',
          },
          {
            text: '完全没有把某项 guidance 纳入生成设计考虑',
            note: '这可能反映 Consumption 不充分，不应仅由 Output Alignment 的最终采用状态来解释',
            variant: 'bad',
          },
        ],
      },
      {
        title: 'What Consumption does NOT require ②：不要求最终输出明显不同',
        variant: 'plain',
        items: [
          {
            text: '冻结上下文判断当前学习者与课程同通用设计一致时，最终 outline 可以接近默认 outline',
            variant: 'ok',
          },
          {
            text: '为了"证明个性化"而强行制造结构差异',
            note: '反而可能破坏合理的课程设计',
            variant: 'bad',
          },
        ],
      },
    ],
    note: '下面是状态关系，不是"不要求"。',
  },
};

const O11b = {
  id: 'O-11b',
  title: 'Possible mismatch states：Consumption 与 Alignment 不一致的两种情况',
  stage: 'prove',
  sources: ['§8'],
  defaultExpanded: false,
  reviewObjects: ['DEC-003'],
  content: {
    type: 'combo',
    pairs: [
      {
        key: 'Consumption = yes · Alignment = no',
        keyVariants: ['ok', 'bad'],
        value: '上下文确实参与了生成，但结果没有满足相关 Required 或没有充分体现目标、范围与教学设计',
        variant: 'warn',
      },
      {
        key: 'Consumption = no · Alignment = apparently yes',
        keyVariants: ['bad', 'warn'],
        value: '结果可能来自默认模板、通用教学模式或偶然相似；不能把它归因于 DeepTutor',
        variant: 'info',
      },
    ],
    note: '这两个目标只有共同成立时，才能支持"本次课程在可追踪意义上消费并体现了课前教学语义"。',
  },
};

/* ------------------------------------------------------------------ *
 * 丁 · 边界与反模式
 * ------------------------------------------------------------------ */

const O12 = {
  id: 'O-12',
  title: '为什么不做第四级：worked-example-first 反例',
  stage: 'boundary',
  sources: ['§6'],
  defaultExpanded: false,
  reviewObjects: ['DEC-002'],
  content: {
    type: 'steps',
    caption: '反例走查：前三条都成立，第四条却推不出来',
    steps: [
      { label: '1', text: 'DeepTutor Recommended：worked-example-first' },
      { label: '2', text: '本次生成：Receipt = yes，Availability = yes，Consumption = yes' },
      {
        label: '3',
        text: '最终课程：确实使用了 worked example',
        note: '到这里可以说 Output Alignment —— 该推荐策略在课程中得到体现',
      },
      {
        label: '4',
        text: '但不能进一步确定：这个 worked example 是因为 DeepTutor 才出现的',
        note:
          '因为 OpenMAIC 的默认生成模板本来可能也会生成 worked example。' +
          '要证明"没有 DeepTutor 就不会有这个输出"，需要反事实比较、控制变量或其他因果设计',
      },
    ],
    verdict: {
      text:
        'Influence 作为第四级会承诺反事实因果，明显强于当前产品目标，也不是普通 Output Alignment 可以保证的，因此不进入本协议的必要产品状态。',
      variant: 'bad',
    },
  },
};

const O13 = {
  id: 'O-13',
  title: '5 种状态组合的产品解释',
  stage: 'boundary',
  sources: ['§7'],
  defaultExpanded: false,
  reviewObjects: ['DEC-001', 'DEC-003'],
  content: {
    type: 'combo',
    pairs: [
      {
        key: 'Receipt 否 · Availability 否 · Consumption 否 · Alignment 不可归因或失败',
        keyVariants: ['bad', 'bad', 'bad', 'muted'],
        value: '上下文没有到达，不能声称 DeepTutor 参与。',
        variant: 'bad',
      },
      {
        key: 'Receipt 是 · Availability 否 · Consumption 否 · Alignment 不可归因或失败',
        keyVariants: ['ok', 'bad', 'bad', 'muted'],
        value: '收到但未形成合法可用上下文。',
        variant: 'warn',
      },
      {
        key: 'Receipt 是 · Availability 是 · Consumption 否 · Alignment 可能表面成功',
        keyVariants: ['ok', 'ok', 'bad', 'warn'],
        value: '上下文可用但未实际参与生成；不能声称 context-grounded generation。',
        variant: 'warn',
      },
      {
        key: 'Receipt 是 · Availability 是 · Consumption 是 · Alignment 未通过',
        keyVariants: ['ok', 'ok', 'ok', 'bad'],
        value: '上下文参与了生成，但最终课程没有充分体现相关语义。',
        variant: 'info',
      },
      {
        key: 'Receipt 是 · Availability 是 · Consumption 是 · Alignment 通过或带 warning',
        keyVariants: ['ok', 'ok', 'ok', 'ok'],
        value: '形成完整的 context-grounded generation 证据。',
        variant: 'ok',
      },
    ],
    note:
      '最后一种状态仍然不证明：DeepTutor 判断一定正确；课程一定有效；学生一定学会；某个输出变化严格由 DeepTutor 导致。',
  },
};

const O14 = {
  id: 'O-14',
  title: '代码侧的边界与反模式',
  stage: 'boundary',
  sources: ['§9', '§12', '§13'],
  defaultExpanded: false,
  reviewObjects: ['DEC-008', 'DEC-010', 'GAP-001', 'GAP-004'],
  content: {
    type: 'checklist',
    panels: [
      {
        title: '不是消费点的位置',
        variant: 'bad',
        items: [
          {
            text: 'scene runtime / scene renderer / 浏览器状态 / 课中 Runtime',
            note: 'Context Consumption 的主要实现位置在 outline generation 链路，不在这里',
            variant: 'bad',
          },
        ],
      },
      {
        title: '不是 Consumption 证明的既有行为',
        variant: 'warn',
        items: [
          {
            text: 'completeFormalLessonOutlines() 在正式 Fusion 分支自动追加 checkpoint/remediation pair',
            note: '属于既有 F60 边界修正对象；未来 Consumption 的成功不应依赖它',
            variant: 'bad',
          },
          {
            text: 'context 出现在 scene-content prompt 中，但 outline generation 本身没有消费它',
            note: '这是 GAP-001 的现状路径',
            variant: 'bad',
          },
        ],
      },
      {
        title: 'Consumption 与 Alignment 的代码职责分离（§14）',
        variant: 'plain',
        items: [
          {
            text: 'Context Consumption 主要改造：generation-session / context projection；scene-outlines-stream route；outline generation orchestration；outline attempt 与 revision lineage',
            variant: 'muted',
          },
          {
            text: 'Output Alignment 主要新增或改造：outline preflight assessment；scene realization assessment；objective / knowledge-scope / guidance judgments；evidence、limitations、aggregation；derived outlineCoverage',
            variant: 'muted',
          },
          {
            text: '两者在 outline revision 和 context lineage 处衔接，但不能用一个替代另一个',
            variant: 'muted',
          },
        ],
      },
    ],
  },
};

const O15 = {
  id: 'O-15',
  title: '明确不决定的 9 项 / 明确不承诺的 5 项',
  stage: 'boundary',
  sources: ['§15'],
  defaultExpanded: false,
  reviewObjects: ['DEC-012', 'Q-001', 'Q-003', 'Q-006', 'Q-007'],
  content: {
    type: 'checklist',
    panels: [
      {
        title: '本文确定三级递进，但不决定',
        variant: 'bad',
        items: [
          { text: '最终 Receipt、Availability、Consumption 的 JSON 字段', variant: 'bad' },
          { text: 'Context Consumption evidence 的具体结构', variant: 'bad' },
          { text: '生成器如何消费上下文（Prompt、结构化 planner、模板或混合生成方式）', variant: 'bad' },
          { text: '是否需要记录生成设计决策', variant: 'bad' },
          { text: 'Consumption 是否由 OpenMAIC 内部判断，还是产生受控跨边界结果', variant: 'bad' },
          { text: '未消费或不可用时，是阻止生成、回退普通课堂还是允许草稿', variant: 'bad' },
          { text: 'Context Consumption 与未来实验性因果分析的关系', variant: 'bad' },
        ],
      },
      {
        title: '本文也不承诺',
        variant: 'bad',
        items: [
          { text: 'DeepTutor 的语义一定正确', variant: 'bad' },
          { text: '模型内部推理被理解或被验证', variant: 'bad' },
          { text: 'Prompt 中包含上下文就一定发生 Consumption', variant: 'bad' },
          { text: '最终输出一定发生了由 DeepTutor 引起的变化', variant: 'bad' },
          { text: 'Output Alignment 可以由 Consumption 单独证明', variant: 'bad' },
        ],
      },
    ],
    note: '本文开头声明的两项边界已放在 O-01：只确定产品语义层级，不构成实现授权。',
  },
};

/* ------------------------------------------------------------------ *
 * 组装
 * ------------------------------------------------------------------ */

const OVERVIEW = {
  sections: [
    {
      id: 'what',
      title: '甲 · 这是什么',
      purpose: '先建立核心定义与系统骨架，再进入运行细节。',
      blocks: [O01, O02, O03, O04, O04b, O04c],
    },
    {
      id: 'how',
      title: '乙 · 它怎么跑',
      purpose: '两条链如何流转，各自的职责边界在哪里。',
      blocks: [O05, O06, O07, O08],
    },
    {
      id: 'prove',
      title: '丙 · 怎么算发生了',
      purpose: '每级状态如何判定、需要什么证据、哪些东西不足以作为证据。',
      blocks: [O09, O10, O10b, O10c, O11, O11b],
    },
    {
      id: 'boundary',
      title: '丁 · 边界与反模式',
      purpose: '明确不做什么、不主张什么，以及代价与状态组合。',
      blocks: [O13, O12, O14, O15],
    },
  ],
};

/* ------------------------------------------------------------------ *
 * 写入（键顺序：design, summary, overview, facts, decisions, gaps, openQuestions）
 *
 * `models` 已移除：那两张 Mermaid 图（三级递进、两条链）现在由 overview 的
 * O-02（ladder）与 O-05（flow）承载，保留 models 会让同一份语义有两处真相。
 * ------------------------------------------------------------------ */

const model = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
const ordered = {};
Object.keys(model).forEach((key) => {
  // 注意：overview 必须无条件用脚本里的 OVERVIEW 覆盖。
  // 第一版写成 `if (key === 'summary') ordered.overview = OVERVIEW;`，
  // 在 fixture 已经有 overview 的情况下会被后面的 `ordered.overview = model.overview` 覆盖回去，
  // 导致脚本改动看起来"写不进去"（旧数据被静默保留）。
  if (key === 'overview' || key === 'models') return;
  ordered[key] = model[key];
  if (key === 'summary') ordered.overview = OVERVIEW;
});
if (!ordered.overview) ordered.overview = OVERVIEW;

const payload = `${JSON.stringify(ordered, null, 2)}\n`;
fs.writeFileSync(FIXTURE, payload, 'utf8');

// 回读校验：确认写进去的就是内存里的对象（防止出现"脚本写了 A、文件却是 B"）。
const readBack = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
const readBackO06 = readBack.overview.sections[1].blocks.find((b) => b.id === 'O-06');
const inMemoryO06 = OVERVIEW.sections[1].blocks.find((b) => b.id === 'O-06');
if (JSON.stringify(readBackO06) !== JSON.stringify(inMemoryO06)) {
  console.error('✗ 回读不一致：文件内容与内存对象不同');
  console.error('  内存 columns:', JSON.stringify(inMemoryO06.content.columns));
  console.error('  文件 columns:', JSON.stringify(readBackO06.content.columns));
  process.exit(1);
}

const blocks = OVERVIEW.sections.flatMap((s) => s.blocks);
console.log(`已写入 overview: ${OVERVIEW.sections.length} 段 / ${blocks.length} 个区块`);
OVERVIEW.sections.forEach((s) => {
  const expanded = s.blocks.filter((b) => b.defaultExpanded).length;
  console.log(`  ${s.id.padEnd(9)} ${String(s.blocks.length).padStart(2)} 块（默认展开 ${expanded}）：${s.blocks.map((b) => b.id).join(', ')}`);
});
const types = [...new Set(blocks.map((b) => b.content.type))];
console.log(`用到的承载形式: ${types.join(', ')}`);
