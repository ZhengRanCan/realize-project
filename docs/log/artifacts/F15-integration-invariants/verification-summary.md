# F15 Verification Summary

2026-10-01：`test-reading-integration` 4/4 passed，完整离线 suite 与 Electron selftest 均通过。F15 保持 blocked：Explore/Back 产品入口尚未实现，合同禁止在本 feature 实现 Explore，故不能伪造 Decision B 的产品级证据。

2026-10-03收口：F19/F20已提供共享导航和Explore，F21补齐键盘/实际窄窗口/预算。原4条本地toy断言已替换，历史blocked记录保留。

| 五组invariant | 真实证据 |
| --- | --- |
| Renderer纪律 | 有效公开bundle→projectReadingBundle/projectL3/L0 HTML，原ID集合/Plan title/covers/review link与Absent/Indeterminate；实际L2/L3 DOM ID和状态data属性，输入前后不变 |
| Back/canonical | F15实际L0选中→Explore→Back，保留选择、resolver次数不增加；F19真实有效Known(0)bundle保留O-01；F20四层原occurrence/焦点/来源现场返回 |
| Coverage | 真实projectReadingBundle计算Planned3/Realized2/Missing1；Generated Missing和Unknown为Unavailable；covers空为N/A |
| L1集合 | 真实projectTopic重叠、多种边界、external过滤、relates-to反转仍crossing、Inside空；真实独立Map→Topic DOM无方向箭头 |
| Source | 真实registry/resolver/projectL3解析§3到95–125，未生成exactLine |

fixtureD没有Plan，不能要求O-01或为它补造配套资料。零occurrence Block采用F19保留明确Plan、Topic区块关联设空并更新hash的有效临时bundle。
输入变体仅用于有界projection分支测试，不称为新的模型Gold；临时资料包按测试正常清理。

命令：两份测试与main逐个node --check、`node scripts/test-reading-integration.js`、`npm run selftest`、`npm run test:all`（包含实际搬迁Preview）、`npm run verify-preview`、harness/docs/experiments。
规范§6按真实覆盖保留Partial，不因全部feature passing声称所有invariant完整证明；历史Track A仍独立。
