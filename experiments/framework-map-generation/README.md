# experiments/framework-map-generation

F07（AI Framework Map Generation）的实验产物目录。

```text
fixture-a/run-01/{request.json, raw-response.txt, framework-map.json, check-map.txt, run-meta.json}
fixture-a/run-02/ …
fixture-b/ … fixture-e/
```

## 规则（F07 §3）

- **每次运行一个独立目录**，编号自动递增；`--run N` 撞车时生成器直接拒绝（退出码 3）。
- **`framework-map.json` 只在 temp 写入 + read-back 校验成功后才原子 rename 产生。**
- **失败请求绝不覆盖既有产物** —— 503 / 传输失败 / 解析失败只会留下 `request.json`（+ `raw-response.txt`）。
- **validator FAIL 的产物必须原样保留**：`AI 成功返回 + JSON 可解析 + HARD FAIL` 是 F07 最重要的实验数据之一。
- **没有任何共享的 `latest-*.json`** —— 存在这种文件本身就是缺陷。

## 产物含义

| 文件 | 内容 |
|---|---|
| `request.json` | 模型 / endpoint / prompt 指纹 / 文档 sha / 消息 sha / 结局。**不含 key。** |
| `raw-response.txt` | AI 返回的 content **原文**，未清洗、未修补 |
| `framework-map.json` | 仅经成功写入协议产生；与 raw response 的 JSON 内容逐字节等价 |
| `check-map.txt` | validator 输出（PASS 或 FAIL 都保留）；结构不可校验时写明原因 |
| `run-meta.json` | 状态 / 协议六步 / 产物 sha / validator 摘要 / `repair: "none"` |

## 生成方式

```bash
node scripts/generate-framework-map.js --fixture a            # 正式 run
node scripts/generate-framework-map.js --fixture a --run 2    # 指定编号（撞车即拒绝）
node scripts/test-generate-framework-map.js                   # 离线安全验证（零模型调用）
```

前置条件与执行顺序见 `docs/features/07-ai-framework-map-generation/`。
