# F24 Native independent review

Date: 2026-10-06. Reviewer: `/root/f24_independent_review`; product baseline `91c25a8`, including new untracked renderer/tests. Read-only review, no external model/API, no duplicate Electron runs.

Confirmed P2: old Block `scrollIntoView` moved the independent page's title, origin/stage, context and page Back out of view. Actual screenshot corroborated it. Parent recorded the incident, added a failing native heading/top assertion and removed only that Block entry scroll; canonical Element positioning remains unchanged.

Final recheck: no remaining P1/P2. Reviewed the five regenerated desktop/narrow screenshots and final entry focus behavior. L2 title/origin/Back are visible at entry; L1's related/meaning tabs occupy the same right or bottom pane.

Other checks: exact original content renderer reuse and old Overview compatibility; Plan authority, separate generation/coverage/Topic/review/source states; L1 three-state entries and independent tab scroll; L2/L3/Explore shared stack/session; escaping and absence of global listener leaks, no inferred source relation or auto-save.

Reviewer independently ran pure F24, Reading bundle projection and Reading projection tests; all passed. Parent owns final Electron/portable Preview/full-suite results in [verification summary](verification-summary.md). One F19 full-chain transient failure and same-diff replay pass are retained there. Actual user reading acceptance remains pending.

## Actual feedback correction review — 2026-10-06

相对4beeaae的Native只读复查无确认P1/P2，纯F24通过。核查披露在主体后；L2原fragment控件保持原path/父Block，角色控件处理Enter/Space并阻止重复，目标互不嵌套；td/th保留表格语义，内部原生button包原内容。Review chip事件仍交给既有委派，Source/session/共享栈不变。建议补真实matrix cell原生键盘路径；父已补Enter/Space和Back焦点验证并通过，不替代用户复验。
