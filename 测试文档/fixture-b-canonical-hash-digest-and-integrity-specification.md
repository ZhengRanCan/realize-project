# Canonical Hash / Digest 与完整性规范

## 1. 文档定位

本文定稿 OpenMAIC（TypeScript）与 DeepTutor（Python）计算以下三个值时共同使用的规范：

- `semanticRequestDigest`
- `factSetDigest`
- `canonicalPayloadHash`

它关闭 F29 可行性审查中的“跨语言 canonical digest/hash 算法没有定义”高优先级缺口。本文是三个 digest/hash 的跨阶段 SSOT；[课前](./02-pre-class-semantic-exchange-protocol.md)、[课中](./04-in-class-semantic-exchange-protocol.md)和[课后](./06-post-class-semantic-exchange-protocol.md)协议定义被保护的领域语义，本文定义其规范化字节与摘要算法。它不表示两个 Fork 已经实现该算法。

规范名称：`fusion-c14n-v1`。

## 2. 给非密码学读者的解释

Hash 可以理解成一段数据的固定长度“指纹”。相同输入必须产生相同指纹；输入有任何受保护的变化，指纹应当变化。

问题在于，下面两段 JSON 对程序而言可以表达同一对象，但原始字节不同：

```json
{"topic":"一次函数","revision":1}
```

```json
{ "revision": 1, "topic": "一次函数" }
```

所以不能直接对收到的 JSON 文本计算 hash。两端必须先按照同一套规则：

1. 只选择该指纹真正要保护的字段。
2. 把等价的 Unicode、时间和集合顺序整理成同一种表达。
3. 把对象转换为唯一的 canonical JSON UTF-8 字节。
4. 对这些字节计算 SHA-256。

本规范不使用 hash 隐藏敏感内容。SHA-256 是完整性与关联工具，不是加密；禁止因为字段最终只显示 digest 就把不该跨边界的正文或个人信息纳入输入。

## 3. 唯一处理流水线

三个 digest 都必须经过同一流水线：

```text
已通过版本化 schema 严格解析的领域对象
  -> Digest Profile 字段白名单投影
  -> Fusion 语义规范化
  -> Domain Separation Envelope
  -> RFC 8785 JSON Canonicalization Scheme (JCS)
  -> UTF-8 bytes（无 BOM、无结尾换行）
  -> SHA-256
  -> "sha256:" + 64 位小写 hexadecimal
```

任何一步不满足规范时都必须拒绝计算，不得回退到普通 `JSON.stringify`、Python `json.dumps` 默认输出或“尽力而为”的字符串拼接。

### 3.1 Domain Separation Envelope

所有 canonical 输入都包在以下对象中：

```text
CanonicalDigestEnvelope
  canonicalization: "fusion-c14n-v1"
  purpose: "semantic-request" | "lesson-fact-set" | "profile-update-candidate"
  valueSchemaVersion
  value
```

`purpose` 防止同一组 JSON 字段在不同用途下产生可互换的 digest。`valueSchemaVersion` 是被投影对象的 digest schema 版本，不等于数据库 migration 版本。

## 4. 通用语义规范化规则

### 4.1 严格解析先于规范化

- 先按已知 schema 拒绝未知字段、类型错误、超限输入和重复 JSON object key。
- 不允许在解析后才静默丢弃未知字段；否则发送方可能以为该字段受 hash 保护。
- JSON 顶层必须是对象。
- `NaN`、`Infinity`、`-Infinity`、注释、尾逗号和非 JSON 值一律拒绝。

### 4.2 字符串与 Unicode

- 所有 object key 和 string value 统一为 Unicode NFC。
- 不进行大小写转换、trim、合并空白、中文标点替换或语言翻译，除非具体 Digest Profile 明确要求。
- 禁止未配对 UTF-16 surrogate 和无法编码为有效 UTF-8 的字符串。
- 如果两个不同 key 经 NFC 后相同，整个输入以 `normalized_key_collision` 拒绝。
- ID、revision、digest、枚举和 namespace 必须是 printable ASCII；ID 比较和集合排序按 ASCII byte 顺序，禁止 locale-aware sort。

例：`"Cafe\u0301"` 与 `"Café"` 在 NFC 后相同；`" 一次函数 "` 与 `"一次函数"` 不相同，因为 canonicalizer 不擅自 trim。

### 4.3 对象字段

- Digest Profile 先构造字段白名单对象。
- 对象 key 的最终排序和 JSON escaping 完全遵循 RFC 8785 JCS。
- 新增 schema 字段默认不进入旧 digest profile；若它会改变被保护的语义，必须提升 `valueSchemaVersion` 并增加 fixture。
- 不允许通过递归删除所有未知字段实现兼容。

### 4.4 数组

数组不会被通用 canonicalizer 自动排序。每个字段必须在 Digest Profile 中声明一种语义：

- `sequence`：顺序有业务含义，保持原顺序。例如 `normalizedLearningObjectives`、教学步骤。
- `set`：顺序无业务含义，投影时按规定稳定键排序，并拒绝重复稳定键。例如 `sourceEventIds`。

没有声明的数组字段不得进入 v1 digest。对象集合只按 Profile 指定的 ASCII stable ID 或 ASCII tuple 排序，不能按整个 JSON、显示名称或当前数据库行顺序排序。

### 4.5 时间

只有 schema 声明为 timestamp 的字符串才执行时间规范化：

- 输入必须是 RFC 3339，必须带 `Z` 或明确数字时区。
- 转为 UTC。
- 输出固定为 `YYYY-MM-DDTHH:mm:ss.SSSZ`。
- 输入最多三位小数；超过毫秒精度在 v1 中拒绝，不截断也不四舍五入。
- 不接受 leap second `:60`、无时区本地时间或自然语言日期。

例：`2026-07-31T23:00:00+08:00` 规范化为 `2026-07-31T15:00:00.000Z`。

### 4.6 数字

- JSON number 必须是有限 IEEE-754 binary64，并按 RFC 8785/ECMAScript number serialization 输出。
- `-0` 规范化为 `0`。
- 整数必须位于 JavaScript safe integer 范围 `[-9007199254740991, 9007199254740991]`。
- Python 不得用默认 `json.dumps` 的 number formatting 冒充 JCS；必须使用通过 golden fixtures 的 JCS 实现。
- 需要十进制精确性的业务量（金额、精确比例、超过 safe integer 的计数）不得依赖 JSON number；其 schema 必须改用定义了正则和 scale 的 canonical decimal string，或使用缩放后的 safe integer。
- v1 不允许 numeric string 与 JSON number 互相转换；`"0.8"` 和 `0.8` 是不同值。

未来已定稿的来源特定 confidence 字段若进入 digest，可以继续使用范围 `[0,1]` 的 JSON number，但两端必须经过同一 JCS number serialization。Candidate 的 confidence wire schema 当前未定稿；不得把一个 generic `confidence` 字段视为 `canonicalPayloadHash` v1 的已确认组成部分。

### 4.7 缺失、`null` 与默认值

- 缺失字段与显式 `null` 不同。
- 可选字段缺失时不进入投影对象。
- 只有 schema 明确允许 `null` 时才能保留 `null`；否则拒绝。
- Digest Profile 不自行补默认值。发送方必须在严格解析/领域规范化阶段先显式物化会影响语义的默认值。
- `false`、`0`、空字符串、空数组和空对象不是“空值”，不得用 truthy/falsy 过滤掉。

### 4.8 JCS 与 UTF-8

完成上述处理后，Envelope 使用 RFC 8785 JCS 序列化：

- 无缩进和字段间空格。
- 无 BOM。
- 无结尾换行。
- 字符串 escape、object key 排序和 number formatting 均以 RFC 8785 为准。
- 产生的 Unicode 字符串编码为 UTF-8 后计算 SHA-256。

Wire format 固定为：

```text
sha256:<64 lowercase hexadecimal characters>
```

不使用 Base64、大写 hexadecimal、裸 64 位 hex 或平台默认编码。

## 5. `semanticRequestDigest` Profile

### 5.1 用途

它绑定 OpenMAIC 课前请求的共同语义根。DeepTutor Proposal、Map、画像投影、Teaching Guidance 和 Frozen Context 必须显式关联该 digest，但这些结果自身内容的完整性由各自 schema、revision、校验和冻结规则保证。它不是请求 ID、Learner 身份、网络消息指纹，也不单独证明被排除字段的内容未被篡改。

Envelope：

```text
canonicalization = fusion-c14n-v1
purpose = semantic-request
valueSchemaVersion = fusion-semantic-request-digest-v1
```

### 5.2 `value` 白名单

```text
normalizedTopic
normalizedLearningObjectives[]       # sequence，保留教学优先顺序
authorizedKnowledgeScope
  namespace
  scopeId
  allowedKnowledgeRefs[]             # set，按 namespace/scopeId/id ASCII tuple
audienceSemantics
  audienceType
  priorKnowledgeBand?
  language
teachingConstraints
  durationMinutes?
  maxSceneCount?
  requiredModes[]?                   # set，按枚举 ASCII
  prohibitedModes[]?                 # set，按枚举 ASCII
requestedKnowledgeRefs[]             # set，按 namespace/scopeId/id ASCII tuple
sourceMaterialRefs[]                 # set，按 materialId ASCII
  materialId
  digest
  purpose
```

字段不存在时遵循缺失规则；具体子对象只能使用本白名单。`sourceMaterialRefs` 只绑定已授权引用及其内容 digest，不把正文放入 canonical input。

Digest Projection Mapping：`semanticRequestDigest` 从 Adapter 规范化后的 `LessonSemanticRequest` 投影计算，不直接 hash 原始 `LessonGenerationIntent`。`LessonGenerationIntent.sourceMaterialRefs[].id` 在规范化后映射为 digest profile 的 `sourceMaterialRefs[].materialId`，`digest` 与 `purpose` 保留；`teachingConstraints.durationMinutes` 直接映射，`depth`、`emphasis`、`exclusions` 等原始教学约束只有在 Adapter 显式物化为 `maxSceneCount`、`requiredModes` 或 `prohibitedModes` 等规范化字段后才进入 digest。TypeScript 与 Python 必须对同一份规范化 digest profile 字段求 hash，不能一端使用 raw `id/depth/emphasis/exclusions`，另一端使用 normalized `materialId/maxSceneCount/requiredModes/prohibitedModes`。

### 5.3 明确排除

- `semanticRequestDigest` 自身。
- `semanticRequestId`、`semanticRequestRevision`、`lessonSessionId`。
- learner、delegation、Token、Cookie、服务身份。
- warnings、clarification、resolution、proposal、profile、mapping 结果。
- created/received/captured 时间、trace ID、request headers、重试次数和网络信息。
- 仅用于展示且不影响课程语义的文案。

请求 revision 变化不必然改变 digest；只有上述语义投影变化才改变。如果 revision 变化但 digest 相同，表示同一语义的重新签发或操作性修订，两端仍需独立校验 revision。

## 6. `factSetDigest` Profile

### 6.1 用途

它冻结“课堂完成时究竟包含哪些权威事实及其内容”，防止 closeout 后增删或改写事实。只对 `sourceEventIds` 计算 hash 不足以保护事实内容。

Envelope：

```text
canonicalization = fusion-c14n-v1
purpose = lesson-fact-set
valueSchemaVersion = fusion-lesson-fact-set-digest-v1
```

### 6.2 `value` 白名单

```text
lessonSessionId
semanticRequestDigest
mappingId
mappingRevision
factSetRevision
facts[]                              # set，按 factId ASCII
  factId
  factKind
  eventId
  attemptId?
  checkpointId?
  lessonKnowledgePointIds[]?         # set，按 ASCII ID
  questionRef?
    questionId
    questionRevision
    questionDigest
  submittedEvidence?
    answerText?                      # NFC，保留空白；仅 OpenMAIC 内部 digest
    selectedOptionIds[]?             # sequence，若题型定义顺序无关则新 schema 改为 set
  localAssessment?
    gradingMode
    correctness?
    score?
    maxScore?
    confidence?
  diagnosisRef?
    diagnosisId
    diagnosisRevision
  directiveRef?
    directiveId
    executionStatus
  degradationReasonCode?
  occurredAt                         # timestamp
```

`facts` 只包含 closeout 事务已验证并纳入冻结边界的事实。某种 `factKind` 不适用的可选字段保持缺失，不填 `null`。

### 6.3 明确排除

- `factSetDigest` 自身、`closedAt`、数据库主键和行版本。
- 写入时间、更新时间、lease、retry、Outbox、日志和 trace 元数据。
- 浏览器 UI 状态、Scene 正文、Prompt、聊天记录和凭证。
- 未进入权威 frozen fact set 的临时事件。

`closedAt` 不进入 digest，因为它描述事务完成时间而不是事实内容；`factSetRevision` 进入 digest，用来阻止不同冻结 revision 共享摘要。

## 7. `canonicalPayloadHash` Profile

### 7.1 用途

它绑定实际发送到 DeepTutor 的 `ProfileUpdateCandidate` 合同 payload，用于幂等冲突检测与 Receipt 严格关联。它不是 HTTP body 原始字节 hash。

Envelope：

```text
canonicalization = fusion-c14n-v1
purpose = profile-update-candidate
valueSchemaVersion = fusion-profile-update-candidate-digest-v1
```

### 7.2 `value` 白名单

```text
schemaVersion
candidateId
idempotencyKey
lessonSessionId
semanticRequestDigest
mappingId
mappingRevision
factSetRevision
factSetDigest
sourceEventIds[]                     # set，按 ASCII ID
observations[]                       # set，按 observationId ASCII
  observationId
  kind
  lessonKnowledgePointId
  authoritativeRef
    namespace
    scopeId
    id
  value
  provenance
    source
    sourceEventId
    sourceDiagnosisId?
    diagnosisRevision?
createdAt                            # timestamp
```

`value` 必须由每个已知 observation kind 的严格 schema 投影；v1 不允许任意自由 JSON。每种 kind 的 value schema 必须声明允许字段、数组语义、数字范围和限制，并在代码 Feature 中增加 fixture。

Candidate confidence 相关字段暂不进入 `fusion-profile-update-candidate-digest-v1`。文档 `06` 最终定稿 mapping/diagnosis/observation/aggregation confidence 的 wire schema 后，必须提升 `valueSchemaVersion`，补充字段白名单和共用 fixtures；不得在 v1 中补回一个 generic `confidence` 字段。

### 7.3 明确排除

- `canonicalPayloadHash` 自身，避免自引用。
- Authorization header、Cookie、服务凭证和 learner 标识。
- HTTP headers、request ID、trace ID、Content-Length 和压缩方式。
- Outbox row ID、attempt、lease、next retry 和投递时间。
- DeepTutor 的 `receivedAt`、Receipt、processing status 和错误详情。

`candidateId` 与 `idempotencyKey` 有意进入 hash。因此同一 idempotency key 换 candidate ID、同一 candidate ID 换 payload 或 createdAt，都会形成冲突，而不是被当作合法 duplicate。

## 8. 规范版本与兼容

规范版本由三部分共同决定：

```text
canonicalization + purpose + valueSchemaVersion
```

- 修正文档说明但不改变 canonical bytes：版本不变。
- 新增非语义字段且不进入旧白名单：旧版本不变。
- 新增或改变受保护字段、数组语义、时间/数字规则：提升对应 `valueSchemaVersion`。
- 改变 JCS、Unicode 或 hash 算法：提升 `canonicalization`。
- 接收方不认识任一版本时以 `unsupported_digest_version` 失败关闭，不猜测兼容。
- 迁移期允许同时读取明确列出的 v1/v2，但每条记录只按其声明版本计算；禁止“先尝试 v1，不同再尝试 v2”后模糊接受。

数据库除 digest 值外必须保存 `canonicalization`、`purpose` 和 `valueSchemaVersion`，或由不可变 schemaVersion 唯一推导并有明确约束。

## 9. TypeScript 与 Python 实现要求

### 9.1 共同接口

两端建议提供相同逻辑接口：

```text
projectForDigest(purpose, valueSchemaVersion, domainObject) -> CanonicalDigestEnvelope
canonicalize(envelope, canonicalization) -> UTF-8 bytes
digest(bytes, "sha256") -> wire digest
verify(expected, actual) -> constant-time equality
```

字段投影与 JCS canonicalizer 分离。禁止让一个通用“删除几个字段”的函数同时承担三种 Digest Profile。

### 9.2 TypeScript

- 不得依赖对象插入顺序或直接 `JSON.stringify(domainObject)`。
- 使用符合 RFC 8785 且通过 fixtures 的实现。
- 排序 set 字段时使用明确 ASCII stable key，不使用 `localeCompare()`。
- 在 schema parser 中拒绝 unsafe integer、未知 observation value 和超精度 timestamp。

### 9.3 Python

- 不得依赖 `json.dumps(sort_keys=True)` 代替 JCS；其浮点、escaping 和默认配置不是本规范合同。
- 使用符合 RFC 8785 且通过 fixtures 的实现。
- 不得将 `Decimal` 暗中转为 binary64 后继续；schema 若使用 exact decimal，应按其 canonical string/scale 规则投影。
- 保存/比较 wire digest 时保持 ASCII 小写格式。

### 9.4 安全比较

Receipt 或服务端校验 digest 时使用运行时提供的 constant-time byte/string comparison。格式不合法时先拒绝；日志最多记录安全截断后的 digest 前缀，不记录敏感 canonical input。

## 10. Golden Fixtures

权威测试向量位于：

```text
docs/harness/FUSION/fixtures/canonical-digest-v1.json
```

每个正常向量包含：

- 已规范化的 `canonicalValue`。
- 唯一 `canonicalJson`。
- UTF-8 byte length。
- 预期 SHA-256 wire digest。

拒绝向量记录失败阶段和稳定 reason code。后续 TypeScript/Python 实现必须共同消费同一文件，不能复制成两份各自维护的 expected values。

最低测试要求：

1. 三种 purpose 各有至少一个成功向量。
2. 改变输入 object key 顺序，canonical bytes 与 digest 不变。
3. NFC 等价字符串结果相同。
4. `+08:00` 与等价 UTC 时间结果相同。
5. set 输入顺序改变结果相同；sequence 顺序改变结果不同。
6. 缺失字段与允许的 `null` 结果不同。
7. `-0` 与 `0` 按 JCS 相同。
8. unsafe integer、超毫秒时间、normalized key collision、未知字段和重复 set ID 被拒绝。

## 11. 错误语义

建议稳定 reason code：

```text
unsupported_canonicalization
unsupported_digest_purpose
unsupported_digest_schema
invalid_json
unknown_field
invalid_null
invalid_unicode
normalized_key_collision
invalid_timestamp
timestamp_precision_unsupported
invalid_number
unsafe_integer
array_semantics_undefined
duplicate_set_member
invalid_ascii_identifier
canonicalization_failed
digest_mismatch
idempotency_conflict
```

客户端输入错误、版本不支持和实际 digest mismatch 均为永久失败，不进行自动无限重试。只有处理所需服务暂时不可用才进入可恢复重试。

## 12. 不变量与实施门禁

1. **先投影后 hash**：禁止对任意数据库模型、HTTP raw body 或运行时对象直接 hash。
2. **字段白名单**：只有 Digest Profile 明确列出的字段受保护；语义新增必须升级版本。
3. **相同语义相同字节**：TypeScript/Python 必须对 golden fixture 产生逐字节相同结果，不只比较最终 hex。
4. **不同用途不可互换**：purpose 必须进入 Envelope。
5. **Hash 不是授权**：digest 匹配不能替代 learner binding、服务身份、schema、scope 或数据资格校验。
6. **Hash 不是加密**：不得将敏感正文仅因被 hash 就视为匿名。
7. **失败关闭**：未知版本、歧义数组、无效 Unicode、数字或时间必须拒绝。

在以下条件满足前，不得把跨 Fork digest/hash Feature 标为 passing：

- 两端共享同一 fixture 文件。
- 两端均验证 canonical bytes、byte length 和 SHA-256。
- randomized object-key-order 测试通过。
- mismatch、unknown version、null/missing、set/sequence、Unicode、数字和时间负向测试通过。
- Candidate duplicate 与 idempotency conflict 使用本规范的 `canonicalPayloadHash` 验证。

## 13. 后续实现中的待定项

F40 已在 OpenMAIC（TypeScript）与 DeepTutor（Python）实现本规范的隔离课前契约内核，并共同消费本文件指定的 fixture；实现包含 `LessonSemanticRequest`、Proposal、Resolution 与 Frozen Context 的严格边界，以及 `semanticRequestDigest` 的 canonical bytes/digest 验证。该实现不提供 Route、Provider、Session 双写、正式读取切换或真实 Agent 决策；这些仍分别属于 F41–F45。

本规范关闭算法选择，不替代未来 schema 实现 Feature。仍需在实现时完成：

- 将现有 TypeScript/Python 具体 contract 字段映射到本文三份白名单。
- 为每个 observation kind 定义受限 `value` schema 和测试向量。
- 选择并锁定两端 RFC 8785 库或经审查的最小实现。
- 确认数据库保存 digest 版本的字段和索引。
- 设计 v1/v2 双读迁移及旧记录的只读/重算策略。
- 将文档 `09` 区分的四类 confidence 映射到文档 `06` Candidate wire schema，并为新的 Candidate digest schema 提升 `valueSchemaVersion`、补充字段白名单和共用 fixtures。
