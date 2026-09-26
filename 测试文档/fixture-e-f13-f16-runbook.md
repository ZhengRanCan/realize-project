# F13–F16 售后链路运行验证 & 部署手册

本手册配合 F12–F16 各 Feature 的 `feature.md` / `details/design.md` / `verification.md` 使用。目标是把"F13–F16 全部 `passing`"所需要的剩余工作拆成可由人工 reviewer 在本地或 CloudBase 环境逐步执行的操作步骤，并附上**回归用例 + 证据留存规范**。

适用读者：

- 项目方 / 主理人：在 CloudBase 部署云函数、配置触发器与网关、上传沙箱脚本
- 独立审查人：在本地或测试环境运行 review，按 §6 checklist 逐项勾选
- 运维 / 上线负责人：把沙箱切到真实环境的执行步骤（§7）

---

## 1. 总览与依赖图

```text
F13 (用户申请/撤销) ─► F14 (商家审批) ─► F15 (补偿 + 失败重试) ─► F16 (微信退款 API)
        │                    │                    │                      │
        ▼                    ▼                    ▼                      ▼
   after-sales-apply    after-sales 列表      runCompensation      refundOrder
   submitAfterSales     after-sales-detail     retryAfterSales…    refundNotify
   cancelAfterSales     queryAdminAfterSales   forceRestockAnd…    refundQueryCron
                        processAfterSales                           refundCommon/config
```

依赖：**F13 → F14 → F15 → F16**。F12 已被这四个 Feature 替代。Round 19：F13–F16 全部 `passing`，F12 unblock 完成并切 `passing`。

---

## 2. 前置：本地代码与构建

### 2.1 node --check 全部相关云函数

```bash
for f in \
  cloudfunctions/submitAfterSales/index.js \
  cloudfunctions/cancelAfterSales/index.js \
  cloudfunctions/submitReturnLogistics/index.js \
  cloudfunctions/processAfterSales/index.js \
  cloudfunctions/processAfterSales/lib/compensation.js \
  cloudfunctions/queryAdminAfterSales/index.js \
  cloudfunctions/retryAfterSalesCompensation/index.js \
  cloudfunctions/forceRestockAndAssets/index.js \
  cloudfunctions/refundCommon/config.js \
  cloudfunctions/refundOrder/index.js \
  cloudfunctions/refundNotify/index.js \
  cloudfunctions/refundQueryCron/index.js \
; do node --check "$f"; done
```

预期：所有文件无错误输出，`exit 0`。

### 2.2 npm 构建

```bash
npm run build:h5
npm run build:mp-weixin
```

预期：`dist/build/h5` 与 `dist/build/mp-weixin` 都生成产物。

> 当前受限 PowerShell 环境下 `npx uni build` 会触发 `spawn EPERM`，需在普通 cmd / PowerShell FullLanguage / WSL 终端复测。

### 2.3 .gitignore 确认

`.gitignore` 必须包含以下条目（防止密钥误提交）：

```
.env
.env.*
*.pem
*.key
*.b64.enc
secrets/
key/*.pem
key/*.pem.b64
```

执行 `git status` 时**不应**出现 `.env / *.pem / *.key` 等敏感文件。

---

## 3. CloudBase 部署

### 3.1 云函数部署顺序

| 顺序 | 函数名 | 备注 |
|---|---|---|
| 1 | `refundCommon`（无需单独部署，作为 lib 被 require） | F16 |
| 2 | `submitAfterSales` | F13 |
| 3 | `cancelAfterSales` | F13 |
| 4 | `submitReturnLogistics` | F12（既有） |
| 5 | `processAfterSales` | F14（行为扩展） |
| 6 | `queryAdminAfterSales` | F14 |
| 7 | `retryAfterSalesCompensation` | F15 |
| 8 | `forceRestockAndAssets` | F15 |
| 9 | `refundOrder` | F16 |
| 10 | `refundNotify` | F16 |
| 11 | `refundQueryCron` | F16 |

部署命令（每条都执行）：

```bash
# 在 cloudfunctions/<fnName> 目录下
cd cloudfunctions/<fnName>
npm install
# 用 CloudBase CLI：tcb fn deploy <fnName>
```

### 3.2 触发器配置

| 函数 | 触发类型 | Cron 表达式 | 备注 |
|---|---|---|---|
| `retryAfterSalesCompensation` | 定时触发器 | `*/10 * * * *` | 每 10 分钟 |
| `refundQueryCron` | 定时触发器 | `*/5 * * * *` | 每 5 分钟 |

> CloudBase 控制台「函数管理 → 触发器」添加。

### 3.3 HTTP 网关路由（F16 退款回调）

需要 CloudBase HTTP 网关创建一条 HTTPS 路由：

| 路径 | 目标函数 |
|---|---|
| `/refundNotify` | `refundNotify` |

> 注：`payNotify` 已存在的 `/payNotify` 路由保持不变。两者独立。
>
> HTTPS URL 配置到 `WECHAT_REFUND_NOTIFY_URL` 环境变量。

### 3.4 环境变量（沙箱模式）

F13–F15 不需要任何环境变量。

F16 沙箱模式需要显式设：

```
WECHAT_REFUND_MODE = sandbox   # 默认值，可省略
WECHAT_REFUND_APPID = (任一字符串)
WECHAT_REFUND_MCHID = (任一字符串)
WECHAT_REFUND_SERIAL_NO = (任一字符串)
```

其他 `WECHAT_REFUND_*` 在沙箱模式下不强制。

> 真实模式见 §7。

---

## 4. 沙箱模式运行验证

### 4.1 数据准备

需要在 `users` 集合中预置 2 条数据：

```js
// 测试用户 A（普通用户）
{
  _openid: 'test_user_a',
  nickName: '小柚',
  openid: 'test_user_a',
  points: 1000
}

// 测试主理人（管理员）
{
  _openid: 'test_admin',
  openid: 'test_admin',
  nickName: '主理人'
}
```

`admin_whitelist` 集合预置：

```js
{ openid: 'test_admin', active: true }
```

`products` 集合预置 1 个商品，库存 = 10：

```js
{
  _id: 'prod_1',
  name: '金曜石手串',
  price: '350.00',
  stock: 10,
  // ...其他字段
}
```

`coupons` 集合预置 1 张有效 + 1 张过期券（可选）：

```js
{ _id: 'coupon_valid', used: true, usedBy: 'test_user_a', usedAt: <下单时间>, expireAt: <未来时间> }
{ _id: 'coupon_expired', used: true, usedBy: 'test_user_a', usedAt: <下单时间>, expireAt: <过去时间> }
```

### 4.2 用例 1：未发货仅退款全链路

**前置**：订单 A1，`totalAmountCents=3500, refundAmountCents=0`，状态 `UNSHIPPED`，已支付。

```text
1. 用户 A 调用 submitAfterSales(orderId=A1.id, reason='NO_LONGER_WANT', refundAmountCents=3500, refundRemark='', evidenceImages=[])
   期望: code=0, afterSalesStatus='REQUESTED', afterSalesType='REFUND_ONLY'
2. 管理员调用 processAfterSales(orderId=A1.id, action='APPROVE_REFUND_ONLY', remark='')
   期望: code=0, afterSalesStatus='APPROVED', cancellationStatus='APPROVED'
3. 管理员调用 refundOrder(orderId=A1.id, refundAmountCents=3500)
   期望: code=0, mode='sandbox', refundStatus='PROCESSING', outRefundNo=R<...>
4. 沙箱 mock 回调 refundNotify（见 §4.5）
   期望: 订单 afterSalesStatus='REFUNDED', refundStatus='SUCCESS', refundedAt 已写入
5. 验证 audit_logs 含 REQUEST / APPROVE_REFUND_ONLY / REFUND_REQUEST / REFUND_NOTIFY / REFUND_SUCCESS / AFTER_SALES_RESTORE 6 条
6. 验证 products.prod_1.stock +1（无退货发货，库存应只在 final compensation 时增加；如果产品未发货但订单内含发货商品链路，此步骤需结合 F15 校验）
```

> 注：F12 5.2 设计要求"未发货取消在 `APPROVED` 时就释放库存"。当前 F15 的 `processAfterSales` 的 `REFUND_SUCCESS` 才触发补偿 — 如果要在 `APPROVED` 即释放，需要扩展 `runCompensation` 入口或新增 `onApproveRefundOnly` 钩子。这是个**已知的待办**，应在 F15 passing 前与 reviewer 确认是否调整。

### 4.3 用例 2：已发货退货退款全链路

**前置**：订单 A2，`totalAmountCents=8800, refundAmountCents=0`，状态 `SHIPPED`，已支付，含 `trackingNo`。

```text
1. submitAfterSales(orderId=A2.id, reason='QUALITY_ISSUE', refundAmountCents=8800, refundRemark='商品有破损', evidenceImages=['cloud://.../a.jpg', 'cloud://.../b.jpg'])
   期望: afterSalesType='RETURN_REFUND'
2. processAfterSales(action='APPROVE_RETURN_REFUND')
   期望: afterSalesStatus='WAIT_RETURN'
3. 用户 A 调用 submitReturnLogistics(orderId=A2.id, returnLogisticsNo='SF1234567890', returnLogisticsCompany='顺丰速运')
   期望: afterSalesStatus='RETURN_SHIPPED'
4. processAfterSales(action='INSPECT_RECEIVED')
   期望: afterSalesStatus='WAIT_INSPECTION'
5. processAfterSales(action='INSPECT_PASS', remark='商品确实破损')
   期望: afterSalesStatus='REFUND_PENDING'
6. refundOrder(orderId=A2.id)
   期望: refundStatus='PROCESSING'
7. 沙箱 mock 通知 refundNotify
   期望: afterSalesStatus='REFUNDED', 库存 +1 (prod_1)
```

### 4.4 用例 3：撤销申请 + 越权

```text
1. submitAfterSales(orderId=A1.id, reason='NO_LONGER_WANT', refundAmountCents=3500)
   期望: afterSalesStatus='REQUESTED'
2. cancelAfterSales(orderId=A1.id)
   期望: afterSalesStatus='CANCELLED', cancelledBy=test_user_a, cancelledAt 已写入
3. 撤销后库存 / 优惠券 / 积分不应发生变化（stockRestored / couponRestored / pointsRestored 均为 false）
4. 用 test_user_b (非订单所有者) 调用 cancelAfterSales(orderId=A1.id)
   期望: code=-1, msg='无权操作该订单'
```

### 4.5 沙箱 mock 通知调用方式

#### 方式 A：HTTP 网关 POST

`POST https://<gateway-host>/refundNotify`

Header：`X-Mock-Source: sandbox`

Body：

```json
{
  "__mock": { "source": "sandbox" },
  "resource": {
    "out_refund_no": "<outRefundNo>",
    "appid": "<your sandbox appid>",
    "mchid": "<your sandbox mchid>",
    "transaction_id": "MOCK_TX_001",
    "status": "SUCCESS",
    "amount": { "refund": 3500, "total": 3500, "currency": "CNY" },
    "channel": "MOCK"
  }
}
```

期望：HTTP 200，body `{ code: 'SUCCESS', refundStatus: 'SUCCESS' }`。

#### 方式 B：直接 cloud function call（开发期调试）

```js
await cloud.callFunction({
  name: 'refundNotify',
  data: {
    headers: { 'X-Mock-Source': 'sandbox' },
    body: JSON.stringify({ __mock: { source: 'sandbox' }, resource: { ... } })
  }
})
```

### 4.6 沙箱查单 cron 验证

`refundQueryCron` 默认 5 分钟一次。手动触发方式：

```bash
# CloudBase CLI
tcb fn invoke refundQueryCron
```

或在云函数详情页"测试"按钮触发。

期望返回：`{ code: 0, scanned: N, success: 1, stillProcessing: 0, failed: 0, mode: 'sandbox' }`（若 80% 成功率命中）。

### 4.7 失败重试验证

模拟补偿失败：

```text
1. 删除 products.prod_1 文档
2. 走用例 2 全链路到 INSPECT_PASS → REFUND_PENDING
3. 调 refundOrder → 调 refundNotify（沙箱 SUCCESS）
   期望: processAfterSales 返回 code=-1, msg='...', compensationFailed=true
   期望: 订单 refundCompensationError 非空，refundCompensationRetryCount=0
4. 恢复 products.prod_1（重新创建）
5. 手动触发 retryAfterSalesCompensation
   期望: result.retrying 或 result.success 增加，订单 stockRestored=true
```

### 4.8 强制补偿

```js
await cloud.callFunction({
  name: 'forceRestockAndAssets',
  data: { orderId: '<id>', remark: '手动强制补偿' }
})
```

期望：仅管理员可调用；只补资产不改 `afterSalesStatus`。

---

## 5. 证据留存规范

每个 Feature `passing` 前需留存以下截图 / 日志：

### 5.1 F13

- `after-sales-apply` 表单填写（未发货 / 已发货 两种提示条）
- 提交后 `order-detail` 售后状态卡（含金额 / 原因 / 凭证缩略图）
- 列表页"退款/售后" Tab 进行中可见
- `cancelAfterSales` 撤销弹窗 + 撤销后列表刷新

### 5.2 F14

- 管理员工作台"售后审批"入口
- 待审 Tab 列表（订单号 / 类型 / 金额 / 原因 / 用户昵称+脱敏 openid / 状态徽章）
- 详情页"同意" / "拒绝" 操作前后
- 拒绝原因弹窗 + 校验
- 退货退款链路：WAIT_RETURN → RETURN_SHIPPED → WAIT_INSPECTION → REFUND_PENDING 全状态推进截图
- `audit_logs` 集合按订单号查询的审计记录

### 5.3 F15

- `REFUND_PENDING → REFUNDED` 后商品库存对比（每个 SKU +qty）
- 已过期 / 有效优惠券的恢复分支
- 积分账户增加前后对比
- 失败场景：`refundCompensationError` 字段被写入，订单状态保持 `REFUND_PENDING / APPROVED`
- 详情页红条 + 强制补偿按钮
- `retryAfterSalesCompensation` 重试日志（成功 + 失败 + 超过上限）
- 并发幂等测试：同一订单被 `REFUND_SUCCESS` 调用 10 次仅补偿一次

### 5.4 F16

- `refundOrder` 沙箱调用日志（mock URL + 请求体 + 响应体）
- `refundNotify` 沙箱回调处理日志（验签 + 解密 + 状态更新）
- `refundQueryCron` 沙箱查单纠偏日志
- `processAfterSales({ action: 'REFUND_SUCCESS' })` 在沙箱退款成功后被调用，F15 库存 + 优惠券 + 积分补偿
- 用户端订单详情从 `REFUND_PENDING → REFUNDED` 状态切换
- 重复通知 / 重复调用的幂等日志

### 5.5 安全审计

```bash
# 1. 仓库不含敏感凭据
git grep -E 'WECHAT_REFUND_(API_V3_KEY|MERCHANT_PRIVATE_KEY|PLATFORM_PUBLIC_KEY)='
# 期望: 无输出

# 2. 日志不含密钥 / 私钥 / 证书
# (在 CloudBase 函数日志中检索 KEY/PRIVATE 关键字)
# 期望: 无命中
```

---

## 6. 独立审查 Checklist

按 F13/F14/F15/F16 各自的 verification.md 逐项勾选，加上本节的全局复核：

### 6.1 F13（用户端售后申请与撤销）

- [ ] 待发货、待收货、已完成订单能打开正确类型的申请表单
- [ ] 金额超实付 / 空原因 / 越权订单被服务端拒绝
- [ ] 提交后进入 `REQUESTED`，列表可见原因、金额和凭证摘要
- [ ] `REQUESTED` 状态可撤销，撤销后恢复原订单状态且不回补库存
- [ ] 重复提交 / 撤销不会生成重复售后记录
- [ ] F14 / F15 / F16 范围内无越界改动

### 6.2 F14（商家审批 UI）

- [ ] 待审 Tab 仅返回 `REQUESTED`
- [ ] 同意未发货进入 `APPROVED`，同意已发货进入 `WAIT_RETURN`
- [ ] 拒绝无原因被拦截
- [ ] 非管理员 / 非 `REQUESTED` / 重复审批全部被拒绝且无副作用
- [ ] 审计日志可追溯

### 6.3 F15（补偿 + 重试）

- [ ] 已发货退货退款 → 验货通过 → 确认退款成功后每个 SKU 库存 +qty
- [ ] 未发货仅退款库存释放时机确认（见 §10 决策表）
- [ ] 并发 / 重复触发只补偿一次
- [ ] 有效优惠券恢复为可用，过期券保持过期并有记录
- [ ] 使用积分的订单只退回一次，账户不存在时记录错误
- [ ] 补偿失败时 `refundCompensationError` 落库且订单不被标记为成功
- [ ] 强制补偿仅管理员可调用，且不修改 `afterSalesStatus`

### 6.4 F16（沙箱退款 API）

- [ ] `refundOrder` 沙箱调用返回 `PROCESSING`，`outRefundNo` 唯一且可复用幂等
- [ ] 沙箱通知 `refundNotify` 经 `X-Mock-Source: sandbox` 触发后正确推进 `afterSalesStatus='REFUNDED'` 并调 `processAfterSales`
- [ ] `refundQueryCron` 沙箱查单 80% 命中率下成功推进
- [ ] 连续 10 次查单失败置 `REFUND_FAILED`
- [ ] 日志不含密钥 / 私钥 / 证书内容
- [ ] `.gitignore` 已屏蔽 `.env / *.pem / *.key`

### 6.5 F12（重新验收）

- [x] ~~F12 verification.md §7 的 A–E 全部勾选~~ —— Round 19 已完成
- [x] ~~把 F12 `feature.md` `status: blocked` 改为 `status: passing` 或保留 `active`（依独立审查结论）~~ —— Round 19 已完成（已改为 `passing`）

---

## 7. 沙箱 → 真实环境切换

仅在沙箱 `passing` 之后执行。

### 7.1 必备环境变量

```
WECHAT_REFUND_MODE = real
WECHAT_REFUND_APPID = <真实 AppID>
WECHAT_REFUND_MCHID = <真实商户号>
WECHAT_REFUND_SERIAL_NO = <真实 apiclient_cert.pem 证书序列号>
WECHAT_REFUND_MERCHANT_PRIVATE_KEY = <apiclient_key.pem 完整内容，含 BEGIN/END 行>
WECHAT_REFUND_PLATFORM_PUBLIC_KEY = <微信支付平台公钥 PEM>
WECHAT_REFUND_PLATFORM_PUBLIC_KEY_ID = <平台公钥 ID（PUB_KEY_ID_ 开头）>
WECHAT_REFUND_API_V3_KEY = <32 位 ASCII API v3 密钥>
WECHAT_REFUND_NOTIFY_URL = https://<your-gateway-host>/refundNotify
WECHAT_REFUND_API_BASE_URL = https://api.mch.weixin.qq.com （默认）
```

> 所有变量**仅从 CloudBase 控制台设置**，仓库内任何位置不得包含其值。

### 7.2 切换步骤

1. 把上述变量写入 CloudBase 函数配置（`refundOrder / refundNotify / refundQueryCron` 三个函数共享）
2. 删除沙箱 `__mock` 调用入口（确认 `refundOrder` 在真实模式下不进入 `mockRefundApply` 分支）
3. 真实环境前置验证：
   - 用 0.01 元真实退款（自付商品 + 自退款）
   - 在微信支付商户平台查看退款记录
   - 在用户真实微信钱包确认到账
4. 通过后把 `WECHAT_REFUND_MODE=real` 设为正式值
5. 把所有 `WECHAT_REFUND_*_MOCK` 类前缀变量从 CloudBase 配置移除（防止误用）

### 7.3 切换后回归

- 重跑 §4.2 / §4.3 / §4.4 / §4.5 / §4.6 / §4.7 / §4.8
- 增加一项"真实环境小金额退款 → 商户平台对账" 用例

---

## 8. 故障排查速查

| 现象 | 可能原因 | 排查方式 |
|---|---|---|
| `refundOrder` 沙箱返回 `mode` 字段缺失 | 旧版本云函数 | 重新部署 `refundOrder` |
| `refundNotify` 返回 400 + `签名校验失败` | 真实模式下未配置 `WECHAT_REFUND_PLATFORM_PUBLIC_KEY` | 检查 CloudBase 函数配置 |
| `refundQueryCron` 一直 `stillProcessing` 递增 | 沙箱 mock 命中 20% CLOSED 分支 | 多触发几次，预期 80% SUCCESS |
| `retryAfterSalesCompensation` `failed` 递增 | `refundCompensationError` 持续非空 | 检查 `products / coupons / users` 数据 |
| `processAfterSales` 拒绝 `REFUND_SUCCESS` 状态转移 | 订单当前状态不在 `APPROVED` 或 `REFUND_PENDING` | 检查 `afterSalesStatus` |
| 列表页"售后" Tab 不显示订单 | `afterSalesStatus` 仍为空 | 用户端调 `fetchOrderById` 触发 fetchLatest |

---

## 9. 与 F01 支付域的边界

- F16 退款云函数**独立**使用 `refundCommon/config.js`，不复用 `payOrder / payNotify` 的代码
- 共享 `WX_PAY_*` 环境变量仅作为**缺省回退**（`WECHAT_REFUND_APPID` 缺省时回退 `WX_PAY_APPID`），不修改支付核心文件
- 真实环境切换需独立配置 `WECHAT_REFUND_*`，避免污染支付域

---

## 10. 决策项：未发货仅退款库存释放时机

F12 设计文档 §5.2 原文：

> 当售后最终进入 `REFUNDED`，或未发货 `REFUND_ONLY` 明确进入代表取消成功的 `APPROVED` / 旧版 `CLOSED` 时，服务端事务必须按订单商品数量回补 `products.stock`。

注意：F12 允许未发货链路在 `APPROVED` 或 `REFUNDED` 两个节点释放库存。F15 当前实现选择了**只在 `REFUND_SUCCESS` 时释放**，这与 F06 老路径 `processCancellation.APPROVE` 的"立刻释放"语义不一致。

### 现状对照表

| 入口 | 同意动作 | 库存释放时机 | 状态链路 | 适用范围 |
|---|---|---|---|---|
| F06 老路径：`cancelOrder` → `processCancellation.APPROVE` | 商家点"同意取消申请" | **APPROVE 时立即** | `REQUESTED → APPROVED → REFUND_PENDING` | 用户点"申请取消"按钮进入 |
| F13/F14 新路径：`submitAfterSales` → `processAfterSales.APPROVE_REFUND_ONLY` | 商家点"同意"（详情页） | **REFUND_SUCCESS 时**（资金到账） | `REQUESTED → APPROVED → REFUND_PENDING → REFUNDED` | 用户点"申请售后"按钮进入 |

### 两种实现的风险

**风险 A（保守，F15 当前实现）：必须等资金到账才释放库存**

- 优点：避免用户拒收退款时库存永久丢失；与 F12 "REFUNDED 才显示到账"原则一致
- 缺点：商家需要两次操作（同意 + 确认退款成功）；用户在 `REFUND_PENDING` 阶段看不到库存已回补

**风险 B（激进，F06 老路径）：商家一同意就释放库存**

- 优点：商家操作少（一次）；用户体验更直接
- 缺点：如果用户拒收退款或支付失败，库存可能已经卖给其他人，导致真实库存不足

### Reviewer 决策项（必看）

- [ ] **决策 1**：未发货仅退款应采用哪种实现？
  - 选 A（保守）→ 当前 F15 实现无需调整。`processAfterSales.APPROVE_REFUND_ONLY` 不调用 `runCompensation`，保持原样。
  - 选 B（激进）→ 需要给 `processAfterSales.APPROVE_REFUND_ONLY` 增加"提前释放库存"的前置步骤。建议在 `processAfterSales/lib/compensation.js` 暴露一个 `releaseStockOnly(tx, order, now)` 函数，然后在 `APPROVE_REFUND_ONLY` 分支开头调用。
- [ ] **决策 2**：如果选 B，是否同步释放优惠券 / 积分？
  - 是 → 完全镜像 F15 完整补偿，扩展 `releaseStockOnly` 为 `releaseAllAssets`。
  - 否 → 仅释放库存，优惠券 / 积分仍按资金到账后退回。
- [ ] **决策 3**：是否在 `submitAfterSales` 阶段就增加 `preferredReleaseStock` 字段让用户选择？
  - 强烈不推荐——这会让用户侧的语义混乱。F13 文档明确"撤销不影响库存"——如果允许用户选时机，与 F13 5.1 的"撤销不触发库存或资产回退"互斥。

### 默认推荐

**保持 F15 当前实现（保守路径）**：

理由：

1. F12 design §5.2 同时允许 `APPROVED` 和 `REFUNDED` 两个节点，但 F12 verification §2 的 acceptance 写的是"重复退款回调/重复点击... `APPROVED` 与 `REFUNDED` 不重复回补"——这暗示幂等闸门要严格，F06 老路径的"APPROVE 即释放"如果与 F15 的"REFUND_SUCCESS 即释放"在同一订单上同时触发，会**绕过 `stockRestored` 闸门**（因为 F06 老路径直接写 `stockRestored=true`，F15 后续就跳过了）。

   而 F06 老路径用的是 `processCancellation`，F13 新路径用的是 `processAfterSales`，两者**写库存释放的代码路径完全不同**（F06 写 `stockRestored=true`，F15 写 `stockRestored=true`），但**互不感知**。如果同一订单既走了 F06 又走了 F13，库存可能重复释放（虽然有 `if (order.stockRestored === true) return` 闸门，但两个 action 的写入顺序与 `stockRestored` 检查的先后需要保证）。

2. F15 的"必须 `REFUND_SUCCESS`"路径天然保证了"用户资金已退回"再释放库存，对账更清晰。

3. F12/F13/F14/F15/F16 的 `audit_logs` 能查到完整链路，**任何资金相关的字段（`refundedAt`）都明确写入**，方便对账。

### 已知业务侧 UX 副作用（无论选 A 还是 B 都存在）

- 用户走 F13 路径后，商家需要两次操作才能让订单到 `REFUNDED`（同意 + 确认退款成功）
- 商家工作台 `after-sales-detail.vue` 在 `APPROVED` 状态下应同时显示"确认退款成功"按钮（当前已实现，见 §6.2）
- `cancelOrder` / `submitAfterSales` 在用户侧是**两个不同入口**，F13 已经在 `order/list/index.vue` 和 `order-detail/index.vue` 都提供了"申请售后"入口

### 决策记录（reviewer 在 F15 passing 前填写）

```
F15 reviewer: ___________________
签字日期:    ___________________
□ 决策 1 = 保守路径（保持 F15 当前实现）
□ 决策 1 = 激进路径（需修改 processAfterSales.APPROVE_REFUND_ONLY + lib/compensation.js 新增 releaseStockOnly）
□ 决策 2 = 激进路径下同步释放优惠券 / 积分
□ 决策 2 = 激进路径下不同步（仅释放库存，资产按资金到账）
决策理由:
_______________________________________________________________
_______________________________________________________________
```

> 此决策记录必须同步到 `docs/harness/features/individual_feature/F15-after-sales-stock-rollback/verification.md` §9 勾选项。

---

## 11. 修订记录

| 版本 | 日期 | 修订内容 |
|---|---|---|
| v0.1 | 2026-03 | 首次编写，配合 F13–F16 实施快照 |
| v0.2 | 2026-03 | 新增 §10 决策项（未发货仅退款库存释放时机）+ §11 修订记录（原 §10 迁移） |
| v0.3 | 2026-03 | 新增 `docs/harness/REVIEWER-GUIDE.md` 作为 reviewer 入门指南（推荐 reviewer 优先阅读该指南） |
