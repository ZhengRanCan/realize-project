# F16 L2 Runtime Verification

## Runtime boundary

2026-10-01：`app/main/main.js` validates `design-review.json`, then calls
`projectL2Overview(model.overview)` and returns `l2ViewModel`. `app/renderer/app.js`
uses that view model for the Overview, table of contents, and block rendering; it no
longer reads `state.model.overview`, `block.sources`, or `block.reviewObjects`.

`scripts/test-reading-runtime.js` verifies 8 structural properties: identity/order,
generated content, source-ref parity, `related` review links, absent vs explicit-empty
review links, and the renderer bypass scan. `npm run selftest` then exercises the
actual preload → IPC → main → renderer route and renders all 21 blocks.

## Commands

```text
$ node scripts/test-reading-runtime.js
reading runtime tests passed: 8 assertions

$ npm run selftest
SELFTEST PASSED

$ npm run test:all
22 + 31 + 29 + 33 + 48 + 35 + 42 + 131 assertions passed
Doc links: 113 markdown files checked, 0 broken.
experiments index: 66 units + 17 artifacts, up to date.

$ npm run verify:harness
Harness gate: 20 features, 0 errors.

$ npm run check:docs
Doc links: 113 markdown files checked, 0 broken.
```
