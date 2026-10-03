# F20 Explore Design

2026-10-03。用户授权补齐合同后自主完成；沿用Native+独立审查。

## Design

Pure projection消费已经校验的L0 VM：Element/Topic typed ref保留原身份；semantic edge和element.topics membership有authority path。
无可遍历关系的Element不可Focus；attachment-only constraint无论membership仍被拒绝。Topic可从schema-declared membership探索，空Topic显示已知无成员。
保持边方向/type/label/note/qualifiers、provenance refs；attachment独立annotation，relationGap独立非edge披露。
Topic blockIds Unknown/empty/known保持；仅已有Block有阅读动作，不升级Block Focus。

Renderer显示Focus与来自/指向关系邻居、membership。位置只是布局，显式箭头/type决定语义；每条关系可展开完整authority/qualification。
L0/Topic提供“探索关系”；全局显式Element/Topic选择器使L2/L3也可进入，不按章节或文本推断默认对象。
未提供Map明确不可用。Topic“在阅读中打开”不可用，因为其canonical landing Deferred。

进入Explore、切换Focus、canonical打开均走F19 controller；Focus只是typed ref，无新ID或独立route/resolver/栈。
共享栈frame保存ReadingAddress与projection现场；返回阅读从该栈pop到最近Reading frame，Back一般动作仍只pop一层。
L3进入时保存当前inspection/source/disclosure；返回按F19 fencing恢复。审核dirty状态不受影响。
Preview内联纯projection/renderer/共享navigation同一实现。

## Plan

- [x] 新增投影准入/方向/membership/annotation/relationGap/三态/输入纯度失败断言，再实现纯模块。
- [x] 新增实际四层Explore/Focus切换/Back≠Resolve/焦点与session测试，接入UI和F19同一栈。
- [x] 内联Preview，完整suite/selftest/portable路径/gates；独立审查修正后同步passing并提交。

规范依据Decision A/B、I1–I8、N4/N6/N10；不改schema、不调用模型、不写用户数据。
