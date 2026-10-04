# Reading comprehension acceptance feedback

Date: 2026-10-04. User tested the actual interface. Outcome: F23 comprehension acceptance did not pass; F17 remains blocked.

## User observations

1. L0's linked objects are abstract; selecting them shows relationship lists that do little to explain the article.
2. Topic navigation becomes visible/relevant before the reader understands the overall architecture; the reader cannot choose Topics meaningfully.
3. The screenshot's further-reading area looks odd; user prefers to revisit L2 later. That area is L1's declared Block entry list, not the L2 explanation itself.
4. L1 has too little information: four objects without sufficient explanations.

## Evidence-based diagnosis

- Public context-consumption Map elements have label/type/role/topics/provenance IDs, without node definitions. The four edges have endpoint/type, without optional natural-language label/note.
- L0 renderFocusPanel lists incoming/outgoing/attachments/provenance, largely restating existing arrows. It does not explain what an object means in this article or why a relationship matters.
- T-01 has E-06/E-07/E-08/E-12 and zero drawable relations. L1 correctly uses boundary-summary, but a list of labels is insufficient for comprehension. Zero relations does not mean zero semantic information.
- Topic proposition already says Receipt/Availability/Consumption can coexist but cannot substitute for one another. The Plan has explicit definitions and boundaries; its SU namespace must not be joined to Map SU merely by matching text IDs. Explanation reuse needs explicit validated binding, or explicit explanatory input. Renderer cannot invent it.

## Proposed direction, not approved implementation

L0 should establish the document's central question and a comprehensible whole before Topic choice. L1 should explain the selected concern through short definitions, meaningful relationship descriptions, distinctions and boundaries, using existing declared information or explicitly validated explanatory input. A no-edge summary needs semantic explanation as well as membership.

Keep structure and evidence semantics; do not fabricate causal/flow edges among concept cards or silently infer Map/Plan identity. Do not place the whole article on L0. L2 redesign remains deferred as requested.

This is diagnosis and a candidate direction, not a completed design or permission to change schemas, source samples, model prompts, or global L0 behavior. Next design must settle explanatory data ownership, scope and reader acceptance before code.

## Feature ownership agreed — 2026-10-04

用户同意并明确要求登记：新建 F25 处理 L0 整篇定位、概念/关系说明与 Topic 导读；原 F23 升至 v0.2 继续补主题解释及无边摘要，blocked 保留；F24 后置。共享解释数据在 F25 设计中明确，F23 复用；此轮是合同登记，不是新 UI/数据协议审批或实现。
