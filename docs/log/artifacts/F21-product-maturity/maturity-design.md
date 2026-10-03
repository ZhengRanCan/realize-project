# F21 Maturity Design and Plan

2026-10-03。用户委托自主补齐合同并完成；Native实施/独立审查。限键盘、披露/窄窗口、性能三项职责。

| UX决定 | 规范依据 | 验证 |
| --- | --- | --- |
| 节点完整name/选中状态、键盘披露 | L0下钻/保留字段，Reading不可逆省略红线 | 真实Tab/Enter/Space与长label |
| Escape顶层返回，编辑不误触动作 | §3.3 Back纪律、L3 origin、人工明确审批 | 原生输入/IME/修饰键/焦点测试 |
| Focus ring/live阅读位置 | 同一地址与原现场；F21可访问性职责 | computed styles/live region/实际focus |
| Explore显式工具放独立工具栏 | 两投影正交、不得从Block猜实体 | 四层入口仍可操作 |
| 窄窗口Source可关闭恢复 | disclosure可达/完整恢复 | 640×720实际bounds/键盘关闭 |
| relates-to无方向 | N5、L1 boundary relation纪律 | SVG marker/Reading与Explore文本 |
| 固定性能预算、不引入遥测 | 不变identity/authority/语义 | public确定性压力fixture/DOM计数 |

## Architecture

沿用现有renderer与共享导航。不新建语义carrier、router或第三方可访问性依赖。
工具从顶部导航挪到独立reading-tools行；窗口窄时顶部wrap、区块目录仅在区块阅读中保留，Topic/Explore不沿用旧目录、图单独滚动、Source在viewport内暂时覆盖。
节点label通过完整aria-label与键盘选中后的详情恢复；常规button/summary采用原生键盘动作。
Escape按当前inspection/source/Explore/Reading顺序处理；SELECT、INPUT、TEXTAREA、editable、composition及修饰键保护。
live位置和保存/提示只描述现有现场，不增加verification状态。关系方向严格来自type，relates-to单独无方向披露。

## Performance budget (set before measurement)

本机Gold与80elements/160edges公开确定性fixture：projection≤250ms，layout+render≤1500ms；单次产品导航≤2000ms。
15轮Explore/Back和inspection开关后DOM量/ID唯一性稳定；不得累积Map事件处理器。
记录Node/Electron/平台/viewport/计数和实际耗时。预算是本机回归边界，不是任意输入/机器保证。

## Implementation steps

- [x] 创建预算/完整语义压力fixture测试、真实键盘/响应式失败断言。
- [x] 补accessible状态/焦点/live区、编辑键盘guard、Escape、工具栏/窄屏样式；修正Reading无方向关系。
- [x] 运行Gold/压力/15轮实际交付测量并记录JSON、公开fixture截图；查看截图修正布局。
- [x] 完整suite/portablePreview/input gates/harness；独立审查修正并复验，登记passing。
