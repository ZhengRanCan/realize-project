# Pre-class Fusion Context Consumption 语义模型

> 本文记录 FUSION/11 第七项产品语义讨论结果。它与 `12-context-consumption-and-output-alignment.md`、`16-output-alignment-semantic-model.md` 和 `17-output-alignment-conceptual-json.md` 衔接，但只讨论 Context Consumption 的产品语义层级，不是 Feature 合同、架构 SSOT、最终 schema 或实现授权。
>
> 本文明确不把 `Context Influence` 作为 Context Consumption 的第四级。Context-side chain 与 Output-side chain 保持分离，二者共同支持“context-grounded generation”的产品叙事，但不承诺严格反事实因果。

## 一、核心决定

Context Consumption 保留三个递进层级：

```text
Context Receipt
      ↓
Context Availability
      ↓
Context Consumption
```

三层分别表示：

```text
Receipt
  上下文到达了系统。

Availability
  合法、冻结、版本一致的上下文已经可以被本次生成使用。

Consumption
  本次生成任务实际把其中的教学语义作为课程设计输入。
```

它们不能互相替代：

```text
Receipt ≠ Availability
Availability ≠ Consumption
```

本次明确不采用以下层级结构：

```text
Receipt
  ↓
Availability
  ↓
Consumption
  ↓
Influence
```

原因是 `Context Influence` 如果定义为“生成结果出现可归因于 DeepTutor 上下文的变化或取舍”，就已经进入 Output Alignment，甚至比 Output Alignment 更强，因为“可归因于”包含一定反事实和因果意味。

## 二、Context-side chain 与 Output-side chain

产品语义上应保留两条相互关联但不互相吞并的链：

### Context-side chain

```text
Context Receipt
      ↓
Context Availability
      ↓
Context Consumption
```

它回答：

> DeepTutor 的冻结教学语义有没有到达本次生成，并被生成任务实际作为课程设计输入使用？

### Output-side chain

```text
Generated Lesson
      ↓
Output Alignment
```

它回答：

> 最终生成的 outline 和 scene 是否在可观察意义上体现了相关目标、知识范围和教学设计要求？

两条链共同支持：

```text
Context-grounded generation narrative
```

即：

> 本次生成过程确实消费了 DeepTutor 的冻结教学语义，同时最终课程在可观察意义上体现了相关教学要求。

这已经足以构成产品需要的可追踪叙事。不需要额外承诺“某个具体输出变化严格由 DeepTutor 导致”。

## 三、Context Receipt：上下文到达系统

`Context Receipt` 表示 OpenMAIC 或其服务端 Fusion 层收到了一份来自课前语义交换链的上下文结果，至少可以识别它属于某个请求或 session lineage。

Receipt 可以说明：

- 系统收到了某个 Proposal、冻结上下文或相关传输结果；
- 传输层或接收层记录了到达事实；
- 后续系统有机会继续进行授权、版本和语义关联检查。

Receipt 不能说明：

- 上下文已经通过合法性校验；
- 上下文属于当前生成请求；
- 上下文已经冻结；
- 当前生成一定可以使用它；
- 生成器实际读过或使用了其中的教学语义；
- 最终 outline 或 scene 已经对齐。

因此，以下事实都只能证明 Receipt，而不能证明 Availability 或 Consumption：

```text
Proposal 到达 HTTP 或消息入口；
响应被写入日志；
响应被保存到 session；
上下文对象出现在内存或数据库中；
生成接口的调用参数中存在一个 context 字段。
```

如果收到的 Proposal 版本未知、请求 lineage 不一致、引用越权或冻结失败，系统仍然可能有 Receipt，但不能继续声称 Availability。

## 四、Context Availability：合法上下文可供本次生成使用

`Context Availability` 表示合法、冻结、版本一致的课前语义上下文已经准备好，并且在本次 outline generation 的授权边界内可被使用。

Availability 至少意味着：

- 上下文来自受信任的服务端路径，而不是浏览器伪造；
- 当前请求、lesson session 和 Frozen Context lineage 一致；
- schema、revision、digest、引用范围和授权关系已经通过必要检查；
- 使用的是同一个冻结上下文，而不是临时拼接的 Profile、Map、Guidance 或旧版本；
- context 在本次生成时仍然处于有效生命周期内；
- 生成阶段具有访问该合法上下文的服务端能力。

Availability 仍然不能说明生成器已经真正使用了上下文。它只说明：

```text
如果生成器需要，它现在可以合法、稳定地使用这份上下文。
```

因此：

```text
Receipt = 上下文到了。
Availability = 合法上下文已经准备好并可用。
```

一个上下文可以有 Receipt 但没有 Availability，例如：

- Proposal 已收到但 digest 与当前请求不一致；
- Proposal 已收到但包含越权知识引用；
- Frozen Context 尚未成功创建；
- context 属于旧 revision；
- 浏览器提交了看似完整但未经服务器授权的上下文；
- 生成请求已经切换到另一个 lesson session。

## 五、Context Consumption：教学语义实际参与生成

`Context Consumption` 表示本次 outline generation 实际使用了冻结上下文中的教学语义，并将其作为课程设计输入，而不是仅仅收到、保存或附加了上下文。

被消费的对象是经过验证和冻结的教学语义，例如：

- 当前课程学习目标；
- 授权且相关的知识范围；
- 必要前置关系；
- 与本课程相关的 learner projection；
- Required design constraints；
- Recommended approaches；
- Evaluation Focus；
- 生成约束、范围建议和明确排除项。

Consumption 不要求把 raw Proposal、DeepTutor 内部响应、工具轨迹或模型推理直接交给生成器。生成器应消费的是服务端从 Frozen Context 派生出的、适合课程设计的语义输入。

### Receipt、Availability 与 Consumption 的递进关系

```text
Receipt：
  我们收到了上下文。

Availability：
  我们确认它合法、冻结、版本一致，并且本次生成可以使用。

Consumption：
  本次生成任务确实把其中的教学语义纳入了课程设计。
```

因此，以下情况都不能单独证明 Consumption：

- Proposal 被成功接收；
- Frozen Context 被成功保存；
- context 在生成请求参数中出现；
- context 被原样附加到 Prompt；
- Prompt 长度增加；
- 生成接口成功返回 outline；
- 输出中偶然出现了 Proposal 中的关键词。

Prompt 可以是 Consumption 的承载方式，但不是产品定义，也不是充分条件。产品要求的是：教学语义成为 outline-design task 的真实输入，能够被生成过程用于组织目标、范围、顺序、活动和教学设计，而不是装饰性文本或未使用附件。

### Consumption 不要求盲目服从

Consumption 不意味着 OpenMAIC 必须机械执行 DeepTutor 的每一项建议。DeepTutor 提供课前教学语义，OpenMAIC 仍然在自身能力、受众、时长、课程约束和普通课堂模型内进行课程设计。

Consumption 的对象是语义要求和教学取向，不是：

```text
sceneId；
route；
React 组件；
播放器命令；
checkpoint/remediation 创建命令；
RuntimeState 修改；
浏览器操作指令。
```

如果某项 Recommended 被纳入设计考虑后最终没有采用，仍然可能满足 Consumption；它会在 Output Alignment 中记录为 `Not adopted`，但不能伪称为已经采用。

如果系统完全没有把某项 guidance 纳入生成设计考虑，问题可能反映 Consumption 不充分，而不应仅由 Output Alignment 的最终采用状态解释。

### Consumption 不要求最终输出必须明显不同

Context Consumption 不要求每次使用 DeepTutor 上下文都必须产生肉眼可见的 outline 差异。如果冻结上下文判断当前学习者和课程与通用设计一致，最终 outline 可能与默认 outline 相近。

只要生成过程确实把上下文作为课程设计输入进行考虑，而不是只接收或保存它，Consumption 仍然可以成立。否则系统会为了证明个性化而强行制造结构差异，反而可能破坏合理的课程设计。

## 六、为什么不把 Context Influence 作为第四级

曾经可以设想：

```text
Receipt
  ↓
Availability
  ↓
Consumption
  ↓
Influence
```

其中 `Influence` 被定义为：

> 生成结果出现可归因于 DeepTutor 上下文的变化或取舍。

但这个定义超出了 Consumption 的产品责任。

例如：

```text
DeepTutor Recommended：worked-example-first

本次生成：
Receipt = yes
Availability = yes
Consumption = yes

最终课程：
确实使用了 worked example。
```

此时可以说：

```text
Output Alignment：
该推荐策略在课程中得到体现。
```

但不能进一步确定：

```text
这个 worked example 是因为 DeepTutor 才出现的。
```

因为 OpenMAIC 的默认生成模板本来可能也会生成 worked example。要证明“没有 DeepTutor 就不会有这个输出”，需要反事实比较、控制变量或其他因果设计，这已经明显强于当前产品目标，也不是普通 Output Alignment 可以保证的。

因此，`Context Influence` 不作为 Context Consumption 的第四级，也不作为本协议的必要产品状态。它可以在未来研究或实验评估中作为独立问题讨论，但不能成为课前生成成功的默认承诺。

## 七、两条链共同支持的产品叙事

Context-side chain 与 Output-side chain 的关系可以表示为：

```text
Context-side chain

Context Receipt
      ↓
Context Availability
      ↓
Context Consumption

Output-side chain

Generated Lesson
      ↓
Output Alignment

两条链共同支持：

Context-grounded generation narrative
```

完整叙事是：

> 本次生成收到并准备了合法、冻结、版本一致的 DeepTutor 课前教学语义；该语义实际参与了 outline generation；最终生成的 outline 和 scene 又在可观察意义上体现了相关目标、知识范围和教学设计要求。

这条叙事可以分别报告两条链的状态，不需要压缩成一个不可解释的“个性化成功”布尔值。

概念上可能出现以下组合：

| Context Receipt | Context Availability | Context Consumption | Output Alignment | 产品解释 |
|---|---|---|---|---|
| 否 | 否 | 否 | 不可归因或失败 | 上下文没有到达，不能声称 DeepTutor 参与。 |
| 是 | 否 | 否 | 不可归因或失败 | 收到但未形成合法可用上下文。 |
| 是 | 是 | 否 | 可能表面成功 | 上下文可用但未实际参与生成；不能声称 context-grounded generation。 |
| 是 | 是 | 是 | 未通过 | 上下文参与了生成，但最终课程没有充分体现相关语义。 |
| 是 | 是 | 是 | 通过或带 warning | 形成完整的 context-grounded generation 证据。 |

最后一种状态仍然不证明：

```text
DeepTutor 判断一定正确；
课程一定有效；
学生一定学会；
某个输出变化严格由 DeepTutor 导致。
```

## 八、与 Output Alignment 的边界

两条链必须保持以下边界：

```text
Context Consumption：
  关注冻结教学语义是否到达并实际参与生成。

Output Alignment：
  关注最终 outline / scene 是否体现相关教学要求。
```

因此：

```text
Consumption ≠ Output Alignment
Output Alignment ≠ Consumption
```

可能出现：

```text
Consumption = yes
Output Alignment = no
```

表示上下文确实参与了生成，但结果没有满足相关 Required 或没有充分体现目标、范围和教学设计。

也可能出现：

```text
Consumption = no
Output Alignment = apparently yes
```

表示结果可能来自默认模板、通用教学模式或偶然相似；不能把它归因于 DeepTutor。

这两个目标只有共同成立时，才能支持：

```text
本次课程在可追踪意义上消费并体现了 DeepTutor 的课前教学语义。
```

## 九、与 OpenMAIC 现有生成链的职责映射

本节把前述产品语义映射到当前 OpenMAIC 的实际生成边界。它不是实现设计或代码改动授权，而是为了避免 Context Consumption 被写成脱离现有系统的抽象概念。

当前 OpenMAIC 的课前 outline 入口是 `app/api/generate/scene-outlines-stream/route.ts`。该入口已经负责：

- 解析课程生成请求；
- 调用 `freezeFormalFusionForOutline()` 或恢复已冻结的正式 Fusion context；
- 通过 `appendFormalTeachingPrompt()` 将当前正式 Fusion 的 generation projection 追加到 outline generation 输入；
- 调用 outline LLM stream；
- 解析、规范化和持久化 outline。

因此，Context Consumption 的 primary production responsibility 位于这条链路，而不是 scene runtime：

```text
freeze / resolve Frozen Context
        ↓
outline generation route
        ↓
server-derived generation projection
        ↓
outline prompt or equivalent planner input
        ↓
outline stream / Outline Generation Attempt
        ↓
outline persistence
```

当前 `lib/fusion/generation-session.ts` 已经存在一个非常小的 `FormalGenerationContextProjection`，并由 `appendFormalTeachingPrompt()` 渲染为 `Frozen lesson guidance`。这可以作为 Context Consumption 的现有起点，但不能自动被视为最终完成状态。当前投影主要包含 topic、mapping lineage、knowledge reference IDs、guidance revision 和 recommended approaches；后续产品讨论仍需决定哪些冻结教学语义必须进入 outline generation，以及怎样区分“投影已注入”与“生成过程实际消费”。

当前 outline route 还会在正式 Fusion 分支调用 `completeFormalLessonOutlines()`，将 checkpoint/remediation pair 追加到生成结果。这个行为属于既有 F60 边界修正对象，不应被当作 Context Consumption 的证明。未来 Context Consumption 的成功不应依赖自动生成 checkpoint/remediation；其目标是让普通 outline 生成消费冻结教学语义。

Scene content 的当前入口是 `app/api/generate/scene-content/route.ts`，底层生成在 `lib/generation/scene-generator.ts`，完整 scene 组装在 `lib/generation/scene-builder.ts`。这些路径主要接收一个 `SceneOutline`，生成 scene content 和 actions；其中 `SceneGenerationContext` 是跨页 speech coherence context，不是 DeepTutor 的 Frozen Context。当前正式 Fusion scene-content route 会恢复服务器存储的 outline，并调用 `appendFormalTeachingPrompt()`，因此代码上仍存在“scene prompt 直接附加 formal context”的路径。

从产品语义上，后续应将这条现有路径理解为需要收敛的边界，而不是让每个 scene 独立重新解释完整 Frozen Context：

```text
FrozenLessonGenerationContext
        ↓
outline generation projection
        ↓
context-shaped Outline Revision
        ↓
scene generation from authoritative outline
```

Scene generation 可以继承必要的 context lineage、outline revision 和由 outline 派生的局部设计约束，用于一致性、追踪和后置 alignment；但不应重新读取完整 raw Proposal、learner projection、DeepTutor 内部响应或另一个 context revision。Scene generation 的主要消费对象应是 context-shaped outline，而不是完整 Frozen Context。

## 十、当前代码边界下的三个生产职责

结合当前 OpenMAIC 结构，三个 Context Consumption 层级可以映射为：

| 产品层级 | OpenMAIC 生产职责 | 当前代码对应的概念入口 | 成功边界 |
|---|---|---|---|
| Context Receipt | 接收和记录课前 context lineage | `freezeFormalFusionForOutline()` / `resolveFormalFusion()` 及 session store | 服务端收到并能关联 context/request/session；不代表可用或已消费 |
| Context Availability | 在当前 outline attempt 中恢复合法、冻结、版本一致 context | `resolveFormalFusion()`、`contextFrom()`、正式 Fusion session recovery | 当前生成可安全读取同一 Frozen Context；不代表 generator 已使用 |
| Context Consumption | 将冻结语义投影到 outline generation 并作为课程设计输入 | `projectFormalGenerationContext()`、`appendFormalTeachingPrompt()`、outline route / generator orchestration | 当前 Outline Generation Attempt 实际使用 generation-facing teaching semantics |

这张表不是说现有函数已经满足最终产品验收，而是说明未来 Feature 应该沿着现有职责边界改造，而不是在 scene renderer、浏览器状态或课中 Runtime 中寻找 Context Consumption 的主要实现位置。

## 十一、Consumption Subject 与当前 OpenMAIC Attempt

Context Consumption 的 Subject 不是抽象的 Frozen Context，也不是最终 scene，而是：

```text
Frozen Context × Outline Generation Attempt
```

在当前 OpenMAIC 代码中，`POST /api/generate/scene-outlines-stream` 的一次请求和其内部一次实际 outline LLM 尝试，是最接近该 Subject 的现有边界。该请求可能因流解析失败而重试，也可能最终产生 outline；因此后续实现应注意区分：

```text
Outline Generation Request
  一次服务端请求。

Outline Generation Attempt
  请求中的一次实际生成尝试，可能有重试。

Outline Revision
  生成成功并被接受后形成的课纲版本。
```

Consumption 可以在 outline 生成结果最终失败时仍然成立：只要某一次实际 Attempt 已经合法使用了 generation-facing projection。反之，outline 成功返回也不能自动证明 Consumption：如果 projection 没有成为真实生成输入，只能算 Receipt 或 Availability。

## 十二、当前代码中“只能算 Receipt / Availability”的典型情况

结合现有代码路径，以下情况不能直接声称 Context Consumption：

- `freezeFormalFusionForOutline()` 成功保存 `frozenLessonGenerationContext`，但 outline generation 没有读取其投影；
- `resolveFormalFusion()` 成功恢复 context，但生成器继续使用普通 requirements 和默认模板；
- `projectFormalGenerationContext()` 被调用，却只生成 lineage 元数据，没有把教学目标、范围或 guidance 转化为设计输入；
- `appendFormalTeachingPrompt()` 返回了包含 context 文本的 Prompt，但生成 orchestration 没有要求 outline 依据这些语义设计；
- formal context 出现在 scene-content prompt 中，但 outline generation 本身没有消费它；
- 浏览器提交的 `outline`、mapping、digest 或 guidance 与服务器 context 不一致，而服务端没有以存储的 outline/context 为权威；
- `completeFormalLessonOutlines()` 自动追加 checkpoint/remediation pair，但没有证明普通 outline generation 消费了 DeepTutor 语义。

这些情况可以分别表示 Receipt 或 Availability，不能仅凭函数调用、Prompt 字符串或生成结果存在就升级为 Consumption。

## 十三、为什么 Primary Consumption Point 仍然是 outline generation

当前 OpenMAIC 的 scene pipeline 是：

```text
SceneOutline
  ↓
scene-content route / generateSceneContent()
  ↓
scene actions
  ↓
complete Scene
```

这个 pipeline 的主要职责是实现已经产生的 outline，而不是重新决定整节课的目标、知识范围和教学顺序。若让每个 scene generator 都独立直接消费完整 Frozen Context，会造成：

- 每个 scene 重新解释同一份 guidance；
- scene 之间可能使用不同 context revision；
- scene 层决定覆盖 outline 层的整体课程设计；
- learner/context 数据重复进入多个 Prompt；
- token 成本增加；
- 后续 realized alignment 难以判断偏差来自 outline 还是 scene。

因此，OpenMAIC 后续应以 outline generation 作为 Primary Consumption Point；scene generation 主要继承 context-shaped outline，并只使用必要 lineage 或由 outline 派生的局部约束。

## 十四、与 Output Alignment 的代码职责分离

当前代码边界可以概念性映射为：

```text
Context Consumption
  主要改造：
    generation-session / context projection；
    scene-outlines-stream route；
    outline generation orchestration；
    outline attempt 与 revision lineage。

Output Alignment
  主要新增或改造：
    outline preflight assessment；
    scene realization assessment；
    objective / knowledge-scope / guidance judgments；
    evidence、limitations、aggregation；
    derived outlineCoverage。
```

Context Consumption 记录“这次 outline generation 使用了什么”；Output Alignment 判断“生成出来的 outline 和 scene 体现了什么”。两者在 outline revision 和 context lineage 处衔接，但不能用一个替代另一个。

`Context Consumption` 的最低证据应以 generation-level 为主：一次 Outline Generation Attempt 使用了哪个 Frozen Context 和哪个 generation-facing projection。`Output Alignment` 则需要在后续阶段对 Objective、Knowledge Scope 和 Guidance Assessment Item 形成局部 Judgment 与可定位 Evidence。

## 十五、产品边界与非主张

本文确定 Context Consumption 的三级递进，但不决定：

- 最终 Receipt、Availability、Consumption 的 JSON 字段；
- Context Consumption evidence 的具体结构；
- 生成器如何消费上下文；
- Prompt、结构化 planner、模板或混合生成方式；
- 是否需要记录生成设计决策；
- Context Consumption 是否由 OpenMAIC 内部判断，还是产生受控跨边界结果；
- 未消费或不可用时是阻止生成、回退普通课堂还是允许草稿；
- Context Consumption 与未来实验性因果分析的关系。

本文也不承诺：

- DeepTutor 的语义一定正确；
- 模型内部推理被理解或被验证；
- Prompt 中包含上下文就一定发生 Consumption；
- 最终输出一定发生了由 DeepTutor 引起的变化；
- Output Alignment 可以由 Consumption 单独证明。

后续可以在本语义模型基础上，再单独讨论 Context Consumption 的概念性 JSON；但该 JSON 应表达 Receipt、Availability、Consumption 的语义差异，不应重新加入 `Context Influence` 作为第四级。
