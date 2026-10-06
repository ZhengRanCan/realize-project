# F24 Native independent review

Date: 2026-10-06. Reviewer: `/root/f24_independent_review`; product baseline `91c25a8`, including new untracked renderer/tests. Read-only review, no external model/API, no duplicate Electron runs.

Confirmed P2: old Block `scrollIntoView` moved the independent page's title, origin/stage, context and page Back out of view. Actual screenshot corroborated it. Parent recorded the incident, added a failing native heading/top assertion and removed only that Block entry scroll; canonical Element positioning remains unchanged.

Final recheck: no remaining P1/P2. Reviewed the five regenerated desktop/narrow screenshots and final entry focus behavior. L2 title/origin/Back are visible at entry; L1's related/meaning tabs occupy the same right or bottom pane.

Other checks: exact original content renderer reuse and old Overview compatibility; Plan authority, separate generation/coverage/Topic/review/source states; L1 three-state entries and independent tab scroll; L2/L3/Explore shared stack/session; escaping and absence of global listener leaks, no inferred source relation or auto-save.

Reviewer independently ran pure F24, Reading bundle projection and Reading projection tests; all passed. Parent owns final Electron/portable Preview/full-suite results in [verification summary](verification-summary.md). One F19 full-chain transient failure and same-diff replay pass are retained there. Actual user reading acceptance remains pending.
