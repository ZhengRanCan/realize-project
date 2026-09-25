#!/usr/bin/env node
'use strict';

/**
 * 手工建立 overview-plan 的 Gold Fixture。
 *
 * 依据：docs/overview-coverage.md（O-01 ~ O-14 覆盖表）+ 已人工确认的 fixtures/context-consumption.json。
 * 不重新自由设计：sourceUnits 的切分依据现有 20 个区块实际承载的语义，逐条回推到原文。
 *
 * 产出的 fixture 用于：
 * 1. `npm run check-plan` 的 PASS 基线；
 * 2. 未来模型生成的 plan 与它对比（Semantic Unit Recall / Grouping / Shape / Fidelity）。
 *
 * 用法：node scripts/backfill-overview-plan.js
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'fixtures', 'context-consumption.overview-plan.json');

/* ------------------------------------------------------------------ *
 * sourceUnits
 *
 * 切分原则：
 * - 一个单元 = 一个可以被独立否定的语义（定义、边界、反例、例外、现状、目标、职责…）
 * - 覆盖 §0 与 §1-§15 全部章节；§9 篇幅最大（18.3%），因此单元最多
 * - kind 只从 schema 的 15 个枚举里取；importance 只有 core / supporting
 * ------------------------------------------------------------------ */

/** [section, kind, importance, statement, id?] */
const RAW_UNITS = [
  // ---------- §0 文档头 ----------
  ['§0', 'non-goal', 'core', '本文只讨论 Context Consumption 的产品语义层级，不是 Feature 合同、架构 SSOT、最终 schema 或实现授权。', 'SU-001'],
  ['§0', 'boundary', 'core', 'Context-side chain 与 Output-side chain 保持分离，二者共同支持 context-grounded generation 的产品叙事，但不承诺严格反事实因果。', 'SU-002'],

  // ---------- §1 核心决定 ----------
  ['§1', 'definition', 'core', 'Context Consumption 保留 Receipt → Availability → Consumption 三个递进层级。', 'SU-003'],
  ['§1', 'definition', 'core', 'Receipt 表示上下文到达了系统；Availability 表示合法、冻结、版本一致的上下文已可被本次生成使用；Consumption 表示本次生成任务实际把其中的教学语义作为课程设计输入。', 'SU-004'],
  ['§1', 'invariant', 'core', '三个层级不能互相替代：Receipt ≠ Availability，Availability ≠ Consumption。', 'SU-005'],
  ['§1', 'rationale', 'supporting', 'Context Influence 若定义为"生成结果出现可归因于 DeepTutor 上下文的变化或取舍"，就已经进入 Output Alignment 甚至比它更强，因为它包含反事实与因果意味。', 'SU-006'],
  ['§1', 'target-state', 'core', '明确不采用 Receipt → Availability → Consumption → Influence 的四级结构。', 'SU-007'],

  // ---------- §2 两条链 ----------
  ['§2', 'definition', 'core', '产品语义上保留两条相互关联但不互相吞并的链：Context-side chain 与 Output-side chain。', 'SU-008'],
  ['§2', 'definition', 'core', 'Context-side chain 回答：DeepTutor 的冻结教学语义有没有到达本次生成，并被生成任务实际作为课程设计输入使用。', 'SU-009'],
  ['§2', 'definition', 'core', 'Output-side chain 回答：最终生成的 outline 和 scene 是否在可观察意义上体现了相关目标、知识范围和教学设计要求。', 'SU-010'],
  ['§2', 'boundary', 'core', '两条链共同支持 context-grounded generation narrative，已经足以构成产品需要的可追踪叙事，不需要额外承诺"某个具体输出变化严格由 DeepTutor 导致"。', 'SU-011'],

  // ---------- §3 Receipt ----------
  ['§3', 'definition', 'core', 'Context Receipt 表示 OpenMAIC 或其服务端 Fusion 层收到了一份来自课前语义交换链的上下文结果，至少可以识别它属于某个请求或 session lineage。', 'SU-012'],
  ['§3', 'boundary', 'core', 'Receipt 能说明：系统收到了某个 Proposal / 冻结上下文或相关传输结果；传输层或接收层记录了到达事实；后续系统有机会继续进行授权、版本和语义关联检查。', 'SU-013'],
  ['§3', 'boundary', 'core', 'Receipt 不能说明：上下文已经通过合法性校验、属于当前生成请求、已经冻结、当前生成一定可以使用它、生成器实际读过或使用了其中的教学语义、最终 outline 或 scene 已经对齐。', 'SU-014'],
  ['§3', 'negative-case', 'core', '以下事实都只能证明 Receipt，不能证明 Availability 或 Consumption：Proposal 到达 HTTP 或消息入口、响应被写入日志、响应被保存到 session、上下文对象出现在内存或数据库中、生成接口的调用参数中存在一个 context 字段。', 'SU-015'],
  ['§3', 'negative-case', 'supporting', '如果收到的 Proposal 版本未知、请求 lineage 不一致、引用越权或冻结失败，系统仍然可能有 Receipt，但不能继续声称 Availability。', 'SU-016'],

  // ---------- §4 Availability ----------
  ['§4', 'definition', 'core', 'Context Availability 表示合法、冻结、版本一致的课前语义上下文已经准备好，并且在本次 outline generation 的授权边界内可被使用。', 'SU-017'],
  ['§4', 'invariant', 'core', 'Availability 至少意味着：来自受信任的服务端路径、请求/session/Frozen Context lineage 一致、schema 与 revision 与 digest 与引用范围和授权关系通过检查、使用的是同一个冻结上下文、仍在有效生命周期内、生成阶段具有访问该合法上下文的服务端能力。', 'SU-018'],
  ['§4', 'boundary', 'core', 'Availability 仍然不能说明生成器已经真正使用了上下文；它只说明"如果生成器需要，它现在可以合法、稳定地使用这份上下文"。', 'SU-019'],
  ['§4', 'negative-case', 'core', '一个上下文可以有 Receipt 但没有 Availability：digest 与当前请求不一致、包含越权知识引用、Frozen Context 尚未成功创建、context 属于旧 revision、浏览器提交了看似完整但未经服务器授权的上下文、生成请求已经切换到另一个 lesson session。', 'SU-020'],
  ['§4', 'boundary', 'supporting', 'Receipt = 上下文到了；Availability = 合法上下文已经准备好并可用。', 'SU-021'],

  // ---------- §5 Consumption ----------
  ['§5', 'definition', 'core', 'Context Consumption 表示本次 outline generation 实际使用了冻结上下文中的教学语义，并将其作为课程设计输入，而不是仅仅收到、保存或附加了上下文。', 'SU-022'],
  ['§5', 'definition', 'core', '被消费的对象是经过验证和冻结的教学语义：学习目标、授权且相关的知识范围、必要前置关系、learner projection、Required design constraints、Recommended approaches、Evaluation Focus、生成约束与范围建议与明确排除项。', 'SU-023'],
  ['§5', 'non-claim', 'core', 'Consumption 不要求把 raw Proposal、DeepTutor 内部响应、工具轨迹或模型推理直接交给生成器。', 'SU-024'],
  ['§5', 'invariant', 'core', 'Receipt 是"我们收到了上下文"；Availability 是"我们确认它合法、冻结、版本一致，并且本次生成可以使用"；Consumption 是"本次生成任务确实把其中的教学语义纳入了课程设计"。', 'SU-025'],
  ['§5', 'negative-case', 'core', '以下情况都不能单独证明 Consumption：Proposal 被成功接收、Frozen Context 被成功保存、context 在生成请求参数中出现、context 被原样附加到 Prompt、Prompt 长度增加、生成接口成功返回 outline、输出中偶然出现了 Proposal 中的关键词。', 'SU-026'],
  ['§5', 'boundary', 'core', 'Prompt 可以是 Consumption 的承载方式，但不是产品定义，也不是充分条件；产品要求的是教学语义成为 outline-design task 的真实输入。', 'SU-027'],
  ['§5', 'invariant', 'core', 'Consumption 不要求盲目服从：某项 Recommended 被纳入设计考虑后最终没有采用，仍可能满足 Consumption，会在 Output Alignment 中记录为 Not adopted，但不能伪称为已经采用。', 'SU-028'],
  ['§5', 'consequence', 'core', '如果系统完全没有把某项 guidance 纳入生成设计考虑，问题可能反映 Consumption 不充分，而不应仅由 Output Alignment 的最终采用状态解释。', 'SU-029'],
  ['§5', 'invariant', 'core', 'Consumption 不要求最终输出必须明显不同：冻结上下文判断学习者与课程同通用设计一致时，最终 outline 可能与默认 outline 相近。', 'SU-030'],
  ['§5', 'rationale', 'supporting', '若要求可见差异，系统会为了证明个性化而强行制造结构差异，反而可能破坏合理的课程设计。', 'SU-031'],

  // ---------- §6 为什么不做第四级 ----------
  ['§6', 'counterexample', 'core', 'worked-example-first 反例：Receipt/Availability/Consumption 全为 yes 且课程确实使用了 worked example，但不能确定这个 worked example 是因为 DeepTutor 才出现的，因为默认生成模板本来可能也会生成它。', 'SU-032'],
  ['§6', 'rationale', 'core', '要证明"没有 DeepTutor 就不会有这个输出"需要反事实比较、控制变量或其他因果设计，这明显强于当前产品目标，也不是普通 Output Alignment 可以保证的。', 'SU-033'],
  ['§6', 'target-state', 'core', 'Context Influence 不作为 Context Consumption 的第四级，也不作为本协议的必要产品状态；它可以在未来研究或实验评估中作为独立问题讨论。', 'SU-034'],

  // ---------- §7 产品叙事与状态组合 ----------
  ['§7', 'definition', 'core', '完整叙事是：本次生成收到并准备了合法、冻结、版本一致的课前教学语义；该语义实际参与了 outline generation；最终生成的 outline 和 scene 又在可观察意义上体现了相关目标、知识范围和教学设计要求。', 'SU-035'],
  ['§7', 'boundary', 'supporting', '这条叙事可以分别报告两条链的状态，不需要压缩成一个不可解释的"个性化成功"布尔值。', 'SU-036'],
  ['§7', 'example', 'core', '5 种状态组合各有产品解释：从"上下文没有到达"到"上下文可用但未实际参与生成"，再到"形成了完整的 context-grounded generation 证据"。', 'SU-037'],
  ['§7', 'non-claim', 'core', '即使是最后一种状态仍然不证明：DeepTutor 判断一定正确、课程一定有效、学生一定学会、某个输出变化严格由 DeepTutor 导致。', 'SU-038'],

  // ---------- §8 与 Output Alignment 的边界 ----------
  ['§8', 'boundary', 'core', 'Context Consumption 关注冻结教学语义是否到达并实际参与生成；Output Alignment 关注最终 outline / scene 是否体现相关教学要求。', 'SU-039'],
  ['§8', 'invariant', 'core', 'Consumption ≠ Output Alignment，Output Alignment ≠ Consumption。', 'SU-040'],
  ['§8', 'example', 'core', 'Consumption = yes 而 Output Alignment = no 表示上下文确实参与了生成，但结果没有满足相关 Required 或没有充分体现目标、范围与教学设计。', 'SU-041'],
  ['§8', 'example', 'core', 'Consumption = no 而 Output Alignment = apparently yes 表示结果可能来自默认模板、通用教学模式或偶然相似，不能把它归因于 DeepTutor。', 'SU-042'],
  ['§8', 'invariant', 'supporting', '这两个目标只有共同成立时，才能支持"本次课程在可追踪意义上消费并体现了课前教学语义"。', 'SU-043'],

  // ---------- §9 与现有生成链的职责映射（篇幅最大） ----------
  ['§9', 'current-state', 'core', '当前课前 outline 入口是 app/api/generate/scene-outlines-stream/route.ts。', 'SU-044'],
  ['§9', 'responsibility', 'core', '该入口已负责：解析课程生成请求、调用 freezeFormalFusionForOutline() 或恢复已冻结的正式 Fusion context、通过 appendFormalTeachingPrompt() 将 generation projection 追加到 outline generation 输入、调用 outline LLM stream、解析规范化与持久化 outline。', 'SU-045'],
  ['§9', 'target-state', 'core', 'Context Consumption 的 primary production responsibility 位于这条链路，而不是 scene runtime：freeze/resolve → outline generation route → server-derived generation projection → outline prompt 或等价 planner input → outline stream / Outline Generation Attempt → outline 持久化。', 'SU-046'],
  ['§9', 'current-state', 'core', 'lib/fusion/generation-session.ts 已存在一个很小的 FormalGenerationContextProjection，并由 appendFormalTeachingPrompt() 渲染为 Frozen lesson guidance。', 'SU-047'],
  ['§9', 'current-state', 'supporting', '当前投影主要包含 topic、mapping lineage、knowledge reference IDs、guidance revision 和 recommended approaches；后续仍需决定哪些冻结教学语义必须进入 outline generation，以及怎样区分"投影已注入"与"生成过程实际消费"。', 'SU-048'],
  ['§9', 'current-state', 'core', '当前 outline route 还会在正式 Fusion 分支调用 completeFormalLessonOutlines()，将 checkpoint/remediation pair 追加到生成结果；该行为属于既有 F60 边界修正对象，不应被当作 Context Consumption 的证明。', 'SU-049'],
  ['§9', 'negative-case', 'core', '未来 Context Consumption 的成功不应依赖自动生成 checkpoint/remediation；其目标是让普通 outline 生成消费冻结教学语义。', 'SU-050'],
  ['§9', 'current-state', 'core', 'Scene content 的当前入口是 app/api/generate/scene-content/route.ts，底层生成在 lib/generation/scene-generator.ts，完整组装在 lib/generation/scene-builder.ts；这些路径主要接收一个 SceneOutline。', 'SU-051'],
  ['§9', 'boundary', 'core', 'SceneGenerationContext 是跨页 speech coherence context，不是 DeepTutor 的 Frozen Context。', 'SU-052'],
  ['§9', 'current-state', 'core', '当前正式 Fusion scene-content route 会恢复服务器存储的 outline，并调用 appendFormalTeachingPrompt()，因此代码上仍存在"scene prompt 直接附加 formal context"的路径。', 'SU-053'],
  ['§9', 'target-state', 'core', '后续应把这条现有路径理解为需要收敛的边界：FrozenLessonGenerationContext → outline generation projection → context-shaped Outline Revision → scene generation from authoritative outline。', 'SU-054'],
  ['§9', 'invariant', 'core', 'Scene generation 可以继承必要的 context lineage、outline revision 和由 outline 派生的局部设计约束，但不应重新读取完整 raw Proposal、learner projection、DeepTutor 内部响应或另一个 context revision。', 'SU-055'],
  ['§9', 'target-state', 'core', 'Scene generation 的主要消费对象应是 context-shaped outline，而不是完整 Frozen Context。', 'SU-056'],

  // ---------- §10 三个生产职责 ----------
  ['§10', 'responsibility', 'core', 'Receipt 对应"接收和记录课前 context lineage"，概念入口是 freezeFormalFusionForOutline() / resolveFormalFusion() 及 session store，成功边界是服务端收到并能关联 context/request/session。', 'SU-057'],
  ['§10', 'responsibility', 'core', 'Availability 对应"在当前 outline attempt 中恢复合法、冻结、版本一致 context"，概念入口是 resolveFormalFusion()、contextFrom()、正式 Fusion session recovery，成功边界是当前生成可安全读取同一 Frozen Context。', 'SU-058'],
  ['§10', 'responsibility', 'core', 'Consumption 对应"将冻结语义投影到 outline generation 并作为课程设计输入"，概念入口是 projectFormalGenerationContext()、appendFormalTeachingPrompt()、outline route / generator orchestration，成功边界是当前 Outline Generation Attempt 实际使用 generation-facing teaching semantics。', 'SU-059'],
  ['§10', 'non-claim', 'core', '这张职责表不表示现有函数已经满足最终产品验收，只说明未来 Feature 应沿现有职责边界改造。', 'SU-060'],

  // ---------- §11 Consumption Subject ----------
  ['§11', 'definition', 'core', 'Context Consumption 的 Subject 不是抽象的 Frozen Context，也不是最终 scene，而是 Frozen Context × Outline Generation Attempt。', 'SU-061'],
  ['§11', 'definition', 'core', '需要区分三种粒度：Outline Generation Request（一次服务端请求）、Outline Generation Attempt（请求中的一次实际生成尝试，可能有重试）、Outline Revision（生成成功并被接受后形成的课纲版本）。', 'SU-062'],
  ['§11', 'invariant', 'core', 'Consumption 可以在 outline 生成结果最终失败时仍然成立：只要某一次实际 Attempt 已经合法使用了 generation-facing projection。', 'SU-063'],
  ['§11', 'boundary', 'core', '反之，outline 成功返回也不能自动证明 Consumption：如果 projection 没有成为真实生成输入，只能算 Receipt 或 Availability。', 'SU-064'],

  // ---------- §12 只能算 Receipt / Availability 的情况 ----------
  ['§12', 'negative-case', 'core', 'freezeFormalFusionForOutline() 成功保存 frozenLessonGenerationContext，但 outline generation 没有读取其投影。', 'SU-065'],
  ['§12', 'negative-case', 'core', 'resolveFormalFusion() 成功恢复 context，但生成器继续使用普通 requirements 和默认模板。', 'SU-066'],
  ['§12', 'negative-case', 'core', 'projectFormalGenerationContext() 被调用，却只生成 lineage 元数据，没有把教学目标、范围或 guidance 转化为设计输入。', 'SU-067'],
  ['§12', 'negative-case', 'core', 'appendFormalTeachingPrompt() 返回了包含 context 文本的 Prompt，但生成 orchestration 没有要求 outline 依据这些语义设计。', 'SU-068'],
  ['§12', 'negative-case', 'core', 'formal context 出现在 scene-content prompt 中，但 outline generation 本身没有消费它。', 'SU-069'],
  ['§12', 'negative-case', 'core', '浏览器提交的 outline、mapping、digest 或 guidance 与服务器 context 不一致，而服务端没有以存储的 outline/context 为权威。', 'SU-070'],
  ['§12', 'negative-case', 'core', 'completeFormalLessonOutlines() 自动追加 checkpoint/remediation pair，但没有证明普通 outline generation 消费了 DeepTutor 语义。', 'SU-071'],
  ['§12', 'boundary', 'core', '这些情况可以分别表示 Receipt 或 Availability，不能仅凭函数调用、Prompt 字符串或生成结果存在就升级为 Consumption。', 'SU-072'],

  // ---------- §13 为什么消费点仍在 outline generation ----------
  ['§13', 'current-state', 'supporting', '当前 scene pipeline 是：SceneOutline → scene-content route / generateSceneContent() → scene actions → complete Scene。', 'SU-073'],
  ['§13', 'rationale', 'core', '这个 pipeline 的主要职责是实现已经产生的 outline，而不是重新决定整节课的目标、知识范围和教学顺序。', 'SU-074'],
  ['§13', 'consequence', 'core', '若让每个 scene generator 都独立直接消费完整 Frozen Context，会造成：每个 scene 重新解释同一份 guidance、scene 之间可能使用不同 context revision、scene 层决定覆盖 outline 层的整体课程设计、learner/context 数据重复进入多个 Prompt、token 成本增加、后续 realized alignment 难以判断偏差来自 outline 还是 scene。', 'SU-075'],
  ['§13', 'target-state', 'core', 'OpenMAIC 后续应以 outline generation 作为 Primary Consumption Point；scene generation 主要继承 context-shaped outline，并只使用必要 lineage 或由 outline 派生的局部约束。', 'SU-076'],

  // ---------- §14 与 Output Alignment 的代码职责分离 ----------
  ['§14', 'responsibility', 'core', 'Context Consumption 主要改造：generation-session / context projection、scene-outlines-stream route、outline generation orchestration、outline attempt 与 revision lineage。', 'SU-077'],
  ['§14', 'responsibility', 'core', 'Output Alignment 主要新增或改造：outline preflight assessment、scene realization assessment、objective 与 knowledge-scope 与 guidance judgments、evidence 与 limitations 与 aggregation、derived outlineCoverage。', 'SU-078'],
  ['§14', 'boundary', 'core', '两者在 outline revision 和 context lineage 处衔接，但不能用一个替代另一个。', 'SU-079'],
  ['§14', 'evidence-requirement', 'core', 'Context Consumption 的最低证据应以 generation-level 为主：一次 Outline Generation Attempt 使用了哪个 Frozen Context 和哪个 generation-facing projection；Output Alignment 则需要在后续阶段形成局部 Judgment 与可定位 Evidence。', 'SU-080'],

  // ---------- §15 产品边界与非主张 ----------
  ['§15', 'open-question', 'core', '本文确定三级递进，但不决定：最终 JSON 字段、Consumption evidence 的具体结构、生成器如何消费上下文、是否需要记录生成设计决策。', 'SU-081'],
  ['§15', 'open-question', 'core', '本文也不决定：Consumption 是否由 OpenMAIC 内部判断还是产生受控跨边界结果、未消费或不可用时是阻止生成还是回退普通课堂还是允许草稿、与未来实验性因果分析的关系。', 'SU-082'],
  ['§15', 'non-claim', 'core', '本文不承诺：DeepTutor 的语义一定正确、模型内部推理被理解或被验证、Prompt 中包含上下文就一定发生 Consumption、最终输出一定发生了由 DeepTutor 引起的变化、Output Alignment 可以由 Consumption 单独证明。', 'SU-083'],
  ['§15', 'target-state', 'supporting', '后续可以在本语义模型基础上再单独讨论概念性 JSON，但该 JSON 应表达 Receipt / Availability / Consumption 的语义差异，不应重新加入 Context Influence 作为第四级。', 'SU-084'],
];

/* ------------------------------------------------------------------ *
 * blocks：直接对应已人工确认的 20 个区块
 * ------------------------------------------------------------------ */

const BLOCKS = [
  {
    id: 'O-01',
    title: '这是什么文档',
    stage: 'what',
    shape: 'prose',
    covers: ['SU-001'],
    sourceRefs: [
      { section: '§0', role: 'non-claim' },
      { section: '§15', role: 'non-claim' },
    ],
    reviewObjects: ['DEC-012'],
    defaultExpanded: true,
    capacityNote: 'prose 只用于文档定位声明；全篇仅此一处。',
  },
  {
    id: 'O-02',
    title: '核心主张：保留三级递进',
    stage: 'what',
    shape: 'ladder',
    covers: ['SU-003', 'SU-004', 'SU-005'],
    sourceRefs: [{ section: '§1', role: 'definition' }],
    reviewObjects: ['DEC-001'],
    defaultExpanded: true,
  },
  {
    id: 'O-03',
    title: '明确不采用：把 Context Influence 作为第四级',
    stage: 'what',
    shape: 'diff',
    covers: ['SU-007', 'SU-006'],
    sourceRefs: [
      { section: '§1', role: 'target-state' },
      { section: '§6', role: 'rationale' },
    ],
    reviewObjects: ['DEC-002'],
    defaultExpanded: true,
  },
  {
    id: 'O-04',
    title: '系统骨架：消费点放在哪一层',
    stage: 'what',
    shape: 'current-target-flow',
    covers: ['SU-044', 'SU-045', 'SU-046', 'SU-047', 'SU-053', 'SU-054', 'SU-055', 'SU-056'],
    sourceRefs: [
      { section: '§9', role: 'current-flow' },
      { section: '§9', role: 'target-flow' },
      { section: '§13', role: 'rationale' },
      { section: '§10', role: 'responsibility' },
      { section: '§14', role: 'responsibility' },
    ],
    reviewObjects: ['DEC-007', 'DEC-008', 'DEC-011', 'FACT-001', 'FACT-002', 'FACT-003', 'FACT-005'],
    defaultExpanded: true,
    capacityNote:
      '这是全文篇幅最大的一节（§9 占 18.3%）。容量超出推荐值，理由：现状与目标必须并排才看得出"要动哪条链"，拆块会丢失对照。',
  },
  {
    id: 'O-04b',
    title: '为什么不把消费点放在 scene',
    stage: 'what',
    shape: 'checklist',
    covers: ['SU-075', 'SU-074', 'SU-076'],
    sourceRefs: [{ section: '§13', role: 'rationale' }],
    reviewObjects: ['DEC-007'],
    defaultExpanded: false,
  },
  {
    id: 'O-04c',
    title: '三个产品层级 → 现有生产职责映射',
    stage: 'what',
    shape: 'matrix',
    covers: ['SU-057', 'SU-058', 'SU-059', 'SU-060'],
    sourceRefs: [
      { section: '§10', role: 'responsibility' },
      { section: '§14', role: 'responsibility' },
    ],
    reviewObjects: ['DEC-011', 'DEC-003'],
    defaultExpanded: false,
  },
  {
    id: 'O-05',
    title: '两条链：Context-side 与 Output-side',
    stage: 'how',
    shape: 'flow',
    covers: ['SU-002', 'SU-008', 'SU-009', 'SU-010', 'SU-011', 'SU-035', 'SU-036'],
    sourceRefs: [
      { section: '§2', role: 'definition' },
      { section: '§7', role: 'definition' },
    ],
    reviewObjects: ['DEC-003'],
    defaultExpanded: true,
  },
  {
    id: 'O-06',
    title: '两条链各自回答什么（职责边界）',
    stage: 'how',
    shape: 'capability-matrix',
    covers: ['SU-039', 'SU-021', 'SU-019', 'SU-043'],
    sourceRefs: [
      { section: '§2', role: 'definition' },
      { section: '§8', role: 'boundary' },
      { section: '§14', role: 'boundary' },
    ],
    reviewObjects: ['DEC-003'],
    defaultExpanded: true,
  },
  {
    id: 'O-07',
    title: '三个层级分别能说明什么、不能说明什么',
    stage: 'how',
    shape: 'capability-matrix',
    covers: ['SU-013', 'SU-014', 'SU-018', 'SU-022'],
    sourceRefs: [
      { section: '§3', role: 'boundary' },
      { section: '§4', role: 'boundary' },
      { section: '§5', role: 'definition' },
    ],
    reviewObjects: ['DEC-004'],
    defaultExpanded: true,
    capacityNote: '每行都是成对的"能 / 不能"，是本形状的典型用法。',
  },
  {
    id: 'O-08',
    title: '消费的对象是什么、不是什么',
    stage: 'how',
    shape: 'two-column-comparison',
    covers: ['SU-023', 'SU-024'],
    sourceRefs: [{ section: '§5', role: 'definition' }],
    reviewObjects: ['DEC-007', 'DEC-006'],
    defaultExpanded: false,
  },
  {
    id: 'O-09',
    title: 'Consumption 的定义与递进关系',
    stage: 'prove',
    shape: 'ladder',
    covers: ['SU-025', 'SU-027'],
    sourceRefs: [{ section: '§5', role: 'definition' }],
    reviewObjects: ['DEC-005'],
    defaultExpanded: true,
  },
  {
    id: 'O-10',
    title: 'HOW DO WE KNOW：怎样证明某个状态真的发生了',
    stage: 'prove',
    shape: 'ladder',
    covers: ['SU-080', 'SU-012', 'SU-017'],
    sourceRefs: [
      { section: '§3', role: 'evidence' },
      { section: '§4', role: 'evidence' },
      { section: '§5', role: 'evidence' },
      { section: '§11', role: 'evidence' },
      { section: '§12', role: 'evidence' },
    ],
    reviewObjects: ['DEC-005', 'DEC-010', 'Q-002'],
    defaultExpanded: true,
  },
  {
    id: 'O-10b',
    title: '这些都不能单独证明 Consumption',
    stage: 'prove',
    shape: 'checklist',
    covers: [
      'SU-015',
      'SU-016',
      'SU-020',
      'SU-026',
      'SU-065',
      'SU-066',
      'SU-067',
      'SU-068',
      'SU-069',
      'SU-070',
      'SU-071',
      'SU-072',
    ],
    sourceRefs: [
      { section: '§5', role: 'boundary' },
      { section: '§12', role: 'counterexample' },
    ],
    reviewObjects: ['DEC-010', 'GAP-004', 'GAP-005'],
    defaultExpanded: true,
    capacityNote: '§12 的七类情况必须成组出现才有说服力，拆开会让读者以为只是孤立反例。',
  },
  {
    id: 'O-10c',
    title: '两个反直觉判断',
    stage: 'prove',
    shape: 'checklist',
    covers: ['SU-063', 'SU-064', 'SU-062'],
    sourceRefs: [
      { section: '§11', role: 'definition' },
      { section: '§12', role: 'boundary' },
    ],
    reviewObjects: ['DEC-009'],
    defaultExpanded: true,
  },
  {
    id: 'O-11',
    title: 'Consumption 不要求什么',
    stage: 'prove',
    shape: 'two-column-comparison',
    covers: ['SU-028', 'SU-029', 'SU-030', 'SU-031'],
    sourceRefs: [{ section: '§5', role: 'invariant' }],
    reviewObjects: ['DEC-005', 'DEC-006'],
    defaultExpanded: false,
  },
  {
    id: 'O-11b',
    title: 'Possible mismatch states：Consumption 与 Alignment 不一致的两种情况',
    stage: 'prove',
    shape: 'combo',
    covers: ['SU-040', 'SU-041', 'SU-042'],
    sourceRefs: [{ section: '§8', role: 'example' }],
    reviewObjects: ['DEC-003'],
    defaultExpanded: false,
  },
  {
    id: 'O-13',
    title: '5 种状态组合的产品解释',
    stage: 'boundary',
    shape: 'combo',
    covers: ['SU-037', 'SU-038', 'SU-036'],
    sourceRefs: [{ section: '§7', role: 'example' }],
    reviewObjects: ['DEC-001', 'DEC-003'],
    defaultExpanded: false,
  },
  {
    id: 'O-12',
    title: '为什么不做第四级：worked-example-first 反例',
    stage: 'boundary',
    shape: 'walkthrough',
    covers: ['SU-032', 'SU-033', 'SU-034'],
    sourceRefs: [{ section: '§6', role: 'counterexample' }],
    reviewObjects: ['DEC-002'],
    defaultExpanded: false,
  },
  {
    id: 'O-14',
    title: '代码侧的边界与反模式',
    stage: 'boundary',
    shape: 'checklist',
    covers: ['SU-048', 'SU-049', 'SU-050', 'SU-051', 'SU-052', 'SU-073', 'SU-077', 'SU-078', 'SU-079'],
    sourceRefs: [
      { section: '§9', role: 'current-state' },
      { section: '§12', role: 'boundary' },
      { section: '§13', role: 'current-state' },
      { section: '§14', role: 'responsibility' },
    ],
    reviewObjects: ['DEC-008', 'DEC-010', 'GAP-001', 'GAP-004'],
    defaultExpanded: false,
  },
  {
    id: 'O-15',
    title: '明确不决定的 9 项 / 明确不承诺的 5 项',
    stage: 'boundary',
    shape: 'checklist',
    covers: ['SU-081', 'SU-082', 'SU-083', 'SU-084'],
    sourceRefs: [{ section: '§15', role: 'non-claim' }],
    reviewObjects: ['DEC-012', 'Q-001', 'Q-003', 'Q-006', 'Q-007'],
    defaultExpanded: false,
  },
  {
    id: 'O-16',
    title: 'Consumption Subject：以哪一次 Attempt 为准',
    stage: 'boundary',
    shape: 'flow',
    covers: ['SU-061', 'SU-080'],
    sourceRefs: [
      { section: '§11', role: 'definition' },
      { section: '§14', role: 'evidence' },
    ],
    reviewObjects: ['DEC-009'],
    defaultExpanded: false,
    capacityNote:
      '回推检查发现的缺口：§11 的 Subject 定义与 §14 的 generation-level 证据要求原先没有任何区块承载，补此块。',
  },
];

/* ------------------------------------------------------------------ *
 * duplicatesMerged：显式记录"为什么没有逐句搬运"
 * ------------------------------------------------------------------ */

const DUPLICATES = [
  {
    sourceUnits: ['SU-005', 'SU-025', 'SU-040'],
    keptInBlock: 'O-02',
    reason: '§1、§5、§8 三处从不同角度重述"层级/维度不能互相替代"，语义同一，合并为一次边界表达。',
  },
  {
    sourceUnits: ['SU-014', 'SU-019', 'SU-026'],
    keptInBlock: 'O-07',
    reason: '三处都是"上层状态不足以推出下层状态"的否定式边界，合并进"能说明 / 不能说明"对照表。',
  },
  {
    sourceUnits: ['SU-015', 'SU-020'],
    keptInBlock: 'O-10b',
    reason: '§3 与 §4 各列一组"不能证明升级"的情形，措辞不同、作用相同，合并为一组反例清单。',
  },
  {
    sourceUnits: ['SU-033', 'SU-006'],
    keptInBlock: 'O-12',
    reason: '§6 的因果论证在 §1 已被简略提过一次；保留完整的反例推演，简略版并入同一结论。',
  },
  {
    sourceUnits: ['SU-049', 'SU-071'],
    keptInBlock: 'O-14',
    reason: 'checkpoint/remediation 自动追加在 §9 与 §12 各出现一次，语义相同，合并为一条反模式。',
  },
  {
    sourceUnits: ['SU-047', 'SU-048'],
    keptInBlock: 'O-04',
    reason: '两处都描述同一个 FormalGenerationContextProjection 的现状，合并为骨架图上的一个节点细节。',
  },
  {
    sourceUnits: ['SU-069', 'SU-053'],
    keptInBlock: 'O-14',
    reason: '§9 与 §12 都指出"formal context 只出现在 scene prompt 而 outline 未消费"，同一反模式，合并。',
  },
];

/**
 * 回推检查发现的缺口（本轮实际发现，记录在此）：
 *
 * - SU-061 / SU-080：§11 的 Consumption Subject 定义与 §14 的 generation-level 证据要求
 *   原先没有任何区块承载 → 新增 O-16。
 * - SU-002 / SU-011 / SU-015 / SU-016 / SU-020 / SU-036 / SU-043：原先只存在于 fixture
 *   的文字里、没有被登记为独立语义单元 → 现在登记并挂到对应区块。
 * - SU-047 / SU-048：§9 的投影现状原先只在 FACT 里，Overview 没有承载 → 挂到 O-04 节点与 O-14。
 */

/* ------------------------------------------------------------------ *
 * 写入 + 自检
 * ------------------------------------------------------------------ */

const plan = {
  planVersion: 1,
  designRef: { id: 'DESIGN-CONTEXT-CONSUMPTION', path: 'fixtures/context-consumption.json' },
  shapeVocabularyVersion: 'shape-catalog-v1',
  sourceUnits: RAW_UNITS.map(([section, kind, importance, statement, id]) => ({
    id,
    section,
    kind,
    statement,
    importance,
  })),
  blocks: BLOCKS,
  duplicatesMerged: DUPLICATES,
};

// 自检 1：id 连续且唯一
const ids = plan.sourceUnits.map((u) => u.id);
const expected = ids.map((_, i) => `SU-${String(i + 1).padStart(3, '0')}`);
if (ids.join(',') !== expected.join(',')) {
  const mismatch = ids.findIndex((id, i) => id !== expected[i]);
  throw new Error(`SU id 不连续：第 ${mismatch + 1} 个是 ${ids[mismatch]}，期望 ${expected[mismatch]}`);
}

// 自检 2：每个 sourceUnit 都被至少一个 block covers（否则 gold fixture 自己就不合格）
const covered = new Set(plan.blocks.flatMap((b) => b.covers));
const uncovered = plan.sourceUnits.filter((u) => !covered.has(u.id));
if (uncovered.length > 0) {
  console.error('✗ 以下 sourceUnit 没有被任何 block 覆盖：');
  uncovered.forEach((u) => console.error(`   ${u.id} [${u.importance}] ${u.statement.slice(0, 40)}…`));
  process.exit(1);
}

// 自检 3：reviewObjects 引用真实存在
const dr = JSON.parse(fs.readFileSync(path.join(ROOT, plan.designRef.path), 'utf8'));
const validObjects = new Set(
  [...dr.decisions, ...dr.facts, ...dr.gaps, ...dr.openQuestions].map((x) => x.id)
);
const badObjects = [];
plan.blocks.forEach((b) => {
  b.reviewObjects.forEach((id) => {
    if (!validObjects.has(id)) badObjects.push(`${b.id}→${id}`);
  });
});
if (badObjects.length > 0) throw new Error(`reviewObjects 引用不存在：${badObjects.join(', ')}`);

// 自检 4：section 标签都能在 docs/source-sections.json 里找到
const sections = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'source-sections.json'), 'utf8'));
const validSections = new Set(sections.sections.map((s) => s.label));
const badSections = new Set();
plan.sourceUnits.forEach((u) => { if (!validSections.has(u.section)) badSections.add(u.section); });
plan.blocks.forEach((b) => b.sourceRefs.forEach((r) => { if (!validSections.has(r.section)) badSections.add(r.section); }));
if (badSections.size > 0) throw new Error(`section 标签不存在：${[...badSections].join(', ')}`);

// 自检 5：duplicatesMerged 引用的单元与区块都存在
plan.duplicatesMerged.forEach((d, i) => {
  d.sourceUnits.forEach((id) => {
    if (!ids.includes(id)) throw new Error(`duplicatesMerged[${i}] 引用不存在的 ${id}`);
  });
  if (!plan.blocks.some((b) => b.id === d.keptInBlock)) {
    throw new Error(`duplicatesMerged[${i}] 的 keptInBlock ${d.keptInBlock} 不存在`);
  }
});

fs.writeFileSync(OUT, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');

const core = plan.sourceUnits.filter((u) => u.importance === 'core').length;
console.log(`已写出 ${path.relative(ROOT, OUT)}`);
console.log(`  sourceUnits ${plan.sourceUnits.length}（core ${core} / supporting ${plan.sourceUnits.length - core}）`);
console.log(`  blocks      ${plan.blocks.length}，覆盖 ${covered.size} 个单元，无遗漏`);
console.log(`  duplicatesMerged ${plan.duplicatesMerged.length} 组`);
const kindCount = {};
plan.sourceUnits.forEach((u) => { kindCount[u.kind] = (kindCount[u.kind] || 0) + 1; });
console.log(`  用到的 kind：${Object.entries(kindCount).map(([k, v]) => `${k}×${v}`).join(', ')}`);
