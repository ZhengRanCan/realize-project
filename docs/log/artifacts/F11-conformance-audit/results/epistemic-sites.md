# F11 epistemic-collapse 逐站登记

扫描范围为 JSON 中明确列出的 9 个投影/布局/渲染/校验边界文件；不声称扫描生成器、vendor 或所有历史脚本。每次命中独立一行，同一行有多个命中时用列号区分。

Unknown/Empty 列判断该站点是否真的消费契约赋予的三态；并非由 optional 推断 Unknown。yes 才进入 S1 backlog；非法输入与缺少未来投影边界另记。

| 证据（文件:行:列） | 表达式 | Unknown/Empty | 状态 | 判据 |
|---|---|---|---|---|
| scripts/l0-view-model.js:33:3 | if (!txt) return null; | no | Compliant | 合法 fallback，不改：正则捕获/CLI 参数/check 文本缺失检测；不将缺失计数归零（parseCheckMap 使用 null）。 |
| scripts/l0-view-model.js:38:43 | const status = (txt.match(/状态:\s*(.+)/) &#124;&#124; [])[1]; | no | Compliant | 合法 fallback，不改：正则捕获/CLI 参数/check 文本缺失检测；不将缺失计数归零（parseCheckMap 使用 null）。 |
| scripts/l0-view-model.js:56:3 | if (!map &#124;&#124; typeof map !== 'object') throw new Error('framework-map 不是对象'); | no | Compliant | 合法 fallback，不改：非对象输入直接抛错，不输出 KnownEmpty。 |
| scripts/l0-view-model.js:59:33 | const elements = map.elements &#124;&#124; []; | no | Compliant | 合法 fallback，不改：map 集合/element.topics/attachment.attachedTo 在 schema 有合法完整载体，缺失是非法输入，不是 Unknown 编码；产品加载未做 schema 验证另记边界缺口。 |
| scripts/l0-view-model.js:60:27 | const edges = map.edges &#124;&#124; []; | no | Compliant | 合法 fallback，不改：map 集合/element.topics/attachment.attachedTo 在 schema 有合法完整载体，缺失是非法输入，不是 Unknown 编码；产品加载未做 schema 验证另记边界缺口。 |
| scripts/l0-view-model.js:61:39 | const attachments = map.attachments &#124;&#124; []; | no | Compliant | 合法 fallback，不改：map 集合/element.topics/attachment.attachedTo 在 schema 有合法完整载体，缺失是非法输入，不是 Unknown 编码；产品加载未做 schema 验证另记边界缺口。 |
| scripts/l0-view-model.js:62:29 | const topics = map.topics &#124;&#124; []; | no | Compliant | 合法 fallback，不改：map 集合/element.topics/attachment.attachedTo 在 schema 有合法完整载体，缺失是非法输入，不是 Unknown 编码；产品加载未做 schema 验证另记边界缺口。 |
| scripts/l0-view-model.js:63:39 | const relationGap = map.relationGap &#124;&#124; []; | no | Compliant | 合法 fallback，不改：optional relationGap 只记录已声明 gap，不承诺穷尽未知关系。 |
| scripts/l0-view-model.js:75:27 | topics: [...(e.topics &#124;&#124; [])], | no | Compliant | 合法 fallback，不改：map 集合/element.topics/attachment.attachedTo 在 schema 有合法完整载体，缺失是非法输入，不是 Unknown 编码；产品加载未做 schema 验证另记边界缺口。 |
| scripts/l0-view-model.js:77:39 | sectionRefs: [...(e.sectionRefs &#124;&#124; [])], | no | Compliant | 合法 fallback，不改：这是显式来源引用列表；缺一条直接来源路径不等于已声明 Unknown 的 block organization。未从空列表推导 evidence 或 claim 状态。 |
| scripts/l0-view-model.js:78:43 | sourceUnitIds: [...(e.sourceUnitIds &#124;&#124; [])], | no | Compliant | 合法 fallback，不改：这是显式来源引用列表；缺一条直接来源路径不等于已声明 Unknown 的 block organization。未从空列表推导 evidence 或 claim 状态。 |
| scripts/l0-view-model.js:84:63 | attachmentAsHost: attachments.filter((a) => (a.attachedTo &#124;&#124; []).includes(e.id)).map((a) => ({ elementId: a.elementId, elementLabel: labelOf(a.elementId) })), | no | Compliant | 合法 fallback，不改：map 集合/element.topics/attachment.attachedTo 在 schema 有合法完整载体，缺失是非法输入，不是 Unknown 编码；产品加载未做 schema 验证另记边界缺口。 |
| scripts/l0-view-model.js:105:53 | const linked = elements.filter((e) => (e.topics &#124;&#124; []).includes(t.id)); | no | Compliant | 合法 fallback，不改：map 集合/element.topics/attachment.attachedTo 在 schema 有合法完整载体，缺失是非法输入，不是 Unknown 编码；产品加载未做 schema 验证另记边界缺口。 |
| scripts/l0-view-model.js:108:39 | sectionRefs: [...(t.sectionRefs &#124;&#124; [])], | no | Compliant | 合法 fallback，不改：这是显式来源引用列表；缺一条直接来源路径不等于已声明 Unknown 的 block organization。未从空列表推导 evidence 或 claim 状态。 |
| scripts/l0-view-model.js:109:33 | blockIds: [...(t.blockIds &#124;&#124; [])], | yes | Violation | topic.blockIds 的 absent=Unknown；输出持久投影字段 []=KnownEmpty，P1 已复现；唯一确认的 S1 backlog。 |
| scripts/l0-view-model.js:118:120 | .map((k) => (map.document[k] ? { key: k, text: map.document[k].text, sectionRefs: [...(map.document[k].sectionRefs &#124;&#124; [])], sourceUnitIds: [...(map.document[k].sourceUnitIds &#124;&#124; [])] } : null)) | no | Compliant | 合法 fallback，不改：这是显式来源引用列表；缺一条直接来源路径不等于已声明 Unknown 的 block organization。未从空列表推导 evidence 或 claim 状态。 |
| scripts/l0-view-model.js:118:179 | .map((k) => (map.document[k] ? { key: k, text: map.document[k].text, sectionRefs: [...(map.document[k].sectionRefs &#124;&#124; [])], sourceUnitIds: [...(map.document[k].sourceUnitIds &#124;&#124; [])] } : null)) | no | Compliant | 合法 fallback，不改：这是显式来源引用列表；缺一条直接来源路径不等于已声明 Unknown 的 block organization。未从空列表推导 evidence 或 claim 状态。 |
| scripts/l0-view-model.js:182:3 | if (!mapPath) { console.error('用法: node scripts/l0-view-model.js --map <framework-map.json> [--check <check-map.txt>] [--out <file>]'); process.exit(2); } | no | Compliant | 合法 fallback，不改：正则捕获/CLI 参数/check 文本缺失检测；不将缺失计数归零（parseCheckMap 使用 null）。 |
| scripts/check-map.js:58:7 | if (!fenceChar) { fenceChar = ch; fenceLen = len; return; } | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:63:5 | if (!m) return; | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:69:67 | heads.forEach((h) => byLevel.set(h.level, (byLevel.get(h.level) &#124;&#124; 0) + 1)); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:82:3 | if (!input) return null; | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:84:33 | return { heads: input.heads &#124;&#124; [], sectionLevel: input.sectionLevel ?? null, top: input.top &#124;&#124; [], all: input.all &#124;&#124; [] }; | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:84:97 | return { heads: input.heads &#124;&#124; [], sectionLevel: input.sectionLevel ?? null, top: input.top &#124;&#124; [], all: input.all &#124;&#124; [] }; | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:84:119 | return { heads: input.heads &#124;&#124; [], sectionLevel: input.sectionLevel ?? null, top: input.top &#124;&#124; [], all: input.all &#124;&#124; [] }; | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:86:25 | const top = input.top &#124;&#124; [], sub = input.sub &#124;&#124; []; | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:86:48 | const top = input.top &#124;&#124; [], sub = input.sub &#124;&#124; []; | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:101:28 | const els = map.elements &#124;&#124; []; | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:102:27 | const edges = map.edges &#124;&#124; []; | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:103:32 | const atts = map.attachments &#124;&#124; []; | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:104:29 | const topics = map.topics &#124;&#124; []; | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:105:32 | const gaps = map.relationGap &#124;&#124; []; | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:121:5 | if (!TYPE_ENUM.includes(e.type)) hard.push(&#96;H1 ${e.id} type="${e.type}" 不在允许词表内&#96;); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:122:5 | if (!KNOWN_ROLES.includes(e.role)) unknownRoles.add(&#96;${e.id}:${e.role}&#96;); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:131:3 | if (!isSection) { | no | Compliant | 合法 fallback，不改：粒度与 source registry 是否可用的分支，缺全集通过 skipped 报告，不报告无引用。 |
| scripts/check-map.js:143:5 | if (!sec.top.length) { | no | Compliant | 合法 fallback，不改：粒度与 source registry 是否可用的分支，缺全集通过 skipped 报告，不报告无引用。 |
| scripts/check-map.js:155:54 | const provenanceOf = (el) => [...(el.sourceUnitIds &#124;&#124; []), ...(el.sectionRefs &#124;&#124; [])]; | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:155:81 | const provenanceOf = (el) => [...(el.sourceUnitIds &#124;&#124; []), ...(el.sectionRefs &#124;&#124; [])]; | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:162:7 | if (!validUnits.has(r)) hard.push(&#96;H3 ${e.id} 的 provenance 指向不存在的位置: ${r}&#96;); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:165:32 | els.forEach((e) => (e.topics &#124;&#124; []).forEach((t) => { | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:166:5 | if (!topicIds.has(t)) hard.push(&#96;H3 ${e.id} 的 topics 指向不存在的 topic: ${t}&#96;); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:173:5 | if (!RELATION_ENUM.includes(ed.type)) hard.push(&#96;H4 ${tag} relation "${ed.type}" 是表外词（要表达词表之外的关系请用 relationGap）&#96;); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:174:5 | if (!byId.has(ed.from)) hard.push(&#96;H3 ${tag} from="${ed.from}" 不存在&#96;); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:175:5 | if (!byId.has(ed.to)) hard.push(&#96;H3 ${tag} to="${ed.to}" 不存在&#96;); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:184:11 | if (!QUALIFIER_KEYS.includes(k)) hard.push(&#96;H8 ${tag} qualifiers.${k} 不是已知的结构属性（只允许 ${QUALIFIER_KEYS.join(' / ')}）&#96;); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:193:20 | else if (!CARDINALITY_ENUM.includes(c[side])) unknownQualifierValues.add(&#96;${tag}.cardinality.${side}=${c[side]}&#96;); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:203:16 | else if (!OWNERSHIP_KNOWN.includes(o)) unknownQualifierValues.add(&#96;${tag}.ownership=${o}&#96;); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:216:5 | if (!byId.has(a.elementId)) hard.push(&#96;H3 attachments[${i}] elementId="${a.elementId}" 不存在&#96;); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:217:19 | (a.attachedTo &#124;&#124; []).forEach((x) => { | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:218:7 | if (!byId.has(x)) hard.push(&#96;H3 attachments[${i}] attachedTo 含不存在的元素 "${x}"&#96;); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:222:95 | const inAtt = new Set([...atts.map((a) => a.elementId), ...atts.flatMap((a) => a.attachedTo &#124;&#124; [])]); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:231:37 | topics.forEach((t) => (t.blockIds &#124;&#124; []).forEach((b) => { | no | Compliant | 合法 fallback，不改：按显式声明验证引用或计算已声明入口数；没有写回 blockIds 或生成 TopicOccurrenceState。导航完整性 HARD 不是宣称 Unknown=Known(0)。 |
| scripts/check-map.js:234:40 | topics.forEach((t) => (t.sectionRefs &#124;&#124; []).forEach((r) => { | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:240:75 | const docUnits = new Set(docEntries.flatMap((d) => [...(d.sourceUnitIds &#124;&#124; []), ...(d.sectionRefs &#124;&#124; [])])); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:240:101 | const docUnits = new Set(docEntries.flatMap((d) => [...(d.sourceUnitIds &#124;&#124; []), ...(d.sectionRefs &#124;&#124; [])])); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:242:5 | if (!validUnits.has(r)) hard.push(&#96;H3 document 入口引用不存在的位置: ${r}&#96;); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:248:45 | const nEl = els.filter((e) => (e.topics &#124;&#124; []).includes(t.id)).length; | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:249:30 | const nNav = (t.blockIds &#124;&#124; []).length + (t.sectionRefs &#124;&#124; []).length; | no | Compliant | 合法 fallback，不改：按显式声明验证引用或计算已声明入口数；没有写回 blockIds 或生成 TopicOccurrenceState。导航完整性 HARD 不是宣称 Unknown=Known(0)。 |
| scripts/check-map.js:249:61 | const nNav = (t.blockIds &#124;&#124; []).length + (t.sectionRefs &#124;&#124; []).length; | no | Compliant | 合法 fallback，不改：按显式声明验证引用或计算已声明入口数；没有写回 blockIds 或生成 TopicOccurrenceState。导航完整性 HARD 不是宣称 Unknown=Known(0)。 |
| scripts/check-map.js:254:66 | const topicBlockIds = new Set(topics.flatMap((t) => t.blockIds &#124;&#124; [])); | no | Compliant | 合法 fallback，不改：按显式声明验证引用或计算已声明入口数；没有写回 blockIds 或生成 TopicOccurrenceState。导航完整性 HARD 不是宣称 Unknown=Known(0)。 |
| scripts/check-map.js:255:69 | const topicSections = new Set(topics.flatMap((t) => t.sectionRefs &#124;&#124; [])); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:258:5 | if (!sectionUnresolved) { | no | Compliant | 合法 fallback，不改：粒度与 source registry 是否可用的分支，缺全集通过 skipped 报告，不报告无引用。 |
| scripts/check-map.js:263:48 | const ep = (plan && plan.duplicatesMerged) &#124;&#124; []; | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:265:28 | const cov = b.covers &#124;&#124; []; | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:278:42 | topics.forEach((t) => (t.sectionRefs &#124;&#124; []).forEach((s) => l2Reach.add(s))); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:282:24 | if (b) (b.covers &#124;&#124; []).forEach((u) => l2Reach.add(u)); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:284:38 | ((plan && plan.duplicatesMerged) &#124;&#124; []).forEach((d) => { | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:285:60 | if (topicBlockIds.has(d.keptInBlock)) (d.sourceUnits &#124;&#124; []).forEach((u) => l2Reach.add(u)); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:328:56 | flow.forEach((e) => indeg.set(e.to, (indeg.get(e.to) &#124;&#124; 0) + 1)); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:332:45 | const nEl = els.filter((e) => (e.topics &#124;&#124; []).includes(t.id)).length; | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:337:30 | const nNav = (t.blockIds &#124;&#124; []).length + (t.sectionRefs &#124;&#124; []).length; | no | Compliant | 合法 fallback，不改：按显式声明验证引用或计算已声明入口数；没有写回 blockIds 或生成 TopicOccurrenceState。导航完整性 HARD 不是宣称 Unknown=Known(0)。 |
| scripts/check-map.js:337:61 | const nNav = (t.blockIds &#124;&#124; []).length + (t.sectionRefs &#124;&#124; []).length; | no | Compliant | 合法 fallback，不改：按显式声明验证引用或计算已声明入口数；没有写回 blockIds 或生成 TopicOccurrenceState。导航完整性 HARD 不是宣称 Unknown=Known(0)。 |
| scripts/check-map.js:373:3 | if (!r.hard.length) L.push('  （无）'); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:377:3 | if (!r.warn.length) L.push('  （无）'); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:381:3 | if (!r.info.length) L.push('  （无）'); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:390:3 | if (!r.skipped.length) L.push('  （无 —— 本次全部检查都已执行）'); | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-map.js:405:3 | if (!mapPath) { | no | Compliant | 合法 fallback，不改：validator 内部已声明引用集合/解析器/局部计数或错误数组；诊断不作为知识状态输出。 |
| scripts/check-block.js:159:3 | if (!content &#124;&#124; typeof content !== 'object') return out; | no | Compliant | 合法 fallback，不改：walker 的空结果是枚举结果；上层 checkBlock 缺 content 会拒绝/抛错（P3），不是支持 Missing 的 coverage API。 |
| scripts/check-block.js:166:36 | sourceUnitIds: sourceUnitIds &#124;&#124; [], | no | Compliant | 合法 fallback，不改：检查已提交 expression 的 provenance 声明；semantic 缺声明 HARD、presentation 豁免；不创造 Evidence。未分类字段不在此 walker，另记无边界。 |
| scripts/check-block.js:177:20 | (content.parts &#124;&#124; []).forEach((part, i) => push(&#96;parts[${i}]&#96;, part.text, part.sourceUnitIds, '段落', { variant: part.variant })); | no | Compliant | 合法 fallback，不改：检查已提交 expression 的 provenance 声明；semantic 缺声明 HARD、presentation 豁免；不创造 Evidence。未分类字段不在此 walker，另记无边界。 |
| scripts/check-block.js:181:20 | (content.lanes &#124;&#124; []).forEach((lane, li) => { | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:183:19 | (lane.nodes &#124;&#124; []).forEach((item, ni) => { | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:200:22 | (content.columns &#124;&#124; []).forEach((c, i) => push(&#96;columns[${i}]&#96;, c, [], '列标题', { presentation: true })); | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:201:19 | (content.rows &#124;&#124; []).forEach((row, ri) => { | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:202:12 | (row &#124;&#124; []).forEach((cell, ci) => { | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:212:20 | (content.sides &#124;&#124; []).forEach((side, si) => { | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:214:19 | (side.lines &#124;&#124; []).forEach((line, li) => { | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:223:20 | (content.tiers &#124;&#124; []).forEach((tier, i) => { | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:231:20 | (content.steps &#124;&#124; []).forEach((step, i) => { | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:238:20 | (content.pairs &#124;&#124; []).forEach((pair, i) => { | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:244:21 | (content.panels &#124;&#124; []).forEach((panel, pi) => { | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:246:20 | (panel.items &#124;&#124; []).forEach((item, ii) => { | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:284:46 | const unitById = new Map((plan.sourceUnits &#124;&#124; []).map((u) => [u.id, u])); | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:285:34 | const planBlock = (plan.blocks &#124;&#124; []).find((b) => b.id === block.id); | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:289:3 | if (!planBlock) { | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:305:3 | if (!schemaResult.valid) { | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:325:34 | const ids = el.sourceUnitIds &#124;&#124; []; | no | Compliant | 合法 fallback，不改：检查已提交 expression 的 provenance 声明；semantic 缺声明 HARD、presentation 豁免；不创造 Evidence。未分类字段不在此 walker，另记无边界。 |
| scripts/check-block.js:328:7 | if (!unitById.has(id)) { | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:330:50 | } else if (planBlock && !(planBlock.covers &#124;&#124; []).includes(id)) { | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:333:47 | &#96;（本块 covers = ${(planBlock.covers &#124;&#124; []).join(', ')}）&#96; | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:364:50 | const covers = (planBlock && planBlock.covers) &#124;&#124; []; | no | Compliant | 合法 fallback，不改（有效 Plan 范围）：required covers 非空；找不到 planBlock 已 HARD。非法 Plan 输入下 ratio=1 是 Decision F 边界缺口，不能凭此新增 S1 carrier。 |
| scripts/check-block.js:392:30 | new Set(el.sourceUnitIds &#124;&#124; []).forEach((id) => { | no | Compliant | 合法 fallback，不改：检查已提交 expression 的 provenance 声明；semantic 缺声明 HARD、presentation 豁免；不创造 Evidence。未分类字段不在此 walker，另记无边界。 |
| scripts/check-block.js:393:36 | reuse.set(id, (reuse.get(id) &#124;&#124; 0) + 1); | no | Compliant | 合法 fallback，不改：本次遍历中初始化 provenance 复用计数，计数全集已知。 |
| scripts/check-block.js:424:26 | (block.content.lanes &#124;&#124; []).forEach((lane, li) => { | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:425:38 | const ids = lane.sourceUnitIds &#124;&#124; []; | no | Compliant | 合法 fallback，不改：检查已提交 expression 的 provenance 声明；semantic 缺声明 HARD、presentation 豁免；不创造 Evidence。未分类字段不在此 walker，另记无边界。 |
| scripts/check-block.js:436:19 | (lane.nodes &#124;&#124; []).forEach((item, ni) => { | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:438:47 | const nodeUnits = (node.sourceUnitIds &#124;&#124; []).map((id) => unitById.get(id)).filter(Boolean); | no | Compliant | 合法 fallback，不改：检查已提交 expression 的 provenance 声明；semantic 缺声明 HARD、presentation 豁免；不创造 Evidence。未分类字段不在此 walker，另记无边界。 |
| scripts/check-block.js:449:45 | const variants = (block.content.lanes &#124;&#124; []).map((l) => l.variant); | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:450:7 | if (!variants.includes('current') &#124;&#124; !variants.includes('target')) { | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:460:43 | const elUnits = (el.sourceUnitIds &#124;&#124; []).map((id) => unitById.get(id)).filter(Boolean); | no | Compliant | 合法 fallback，不改：检查已提交 expression 的 provenance 声明；semantic 缺声明 HARD、presentation 豁免；不创造 Evidence。未分类字段不在此 walker，另记无边界。 |
| scripts/check-block.js:472:66 | const carriers = elements.filter((el) => (el.sourceUnitIds &#124;&#124; []).includes(id)); | no | Compliant | 合法 fallback，不改：检查已提交 expression 的 provenance 声明；semantic 缺声明 HARD、presentation 豁免；不创造 Evidence。未分类字段不在此 walker，另记无边界。 |
| scripts/check-block.js:486:51 | if (elements.some((el) => (el.sourceUnitIds &#124;&#124; []).some((id) => unitById.get(id) && unitById.get(id).kind === 'open-question'))) { | no | Compliant | 合法 fallback，不改：检查已提交 expression 的 provenance 声明；semantic 缺声明 HARD、presentation 豁免；不创造 Evidence。未分类字段不在此 walker，另记无边界。 |
| scripts/check-block.js:498:66 | const carriers = elements.filter((el) => (el.sourceUnitIds &#124;&#124; []).includes(id)); | no | Compliant | 合法 fallback，不改：检查已提交 expression 的 provenance 声明；semantic 缺声明 HARD、presentation 豁免；不创造 Evidence。未分类字段不在此 walker，另记无边界。 |
| scripts/check-block.js:514:35 | lanes: (block.content.lanes &#124;&#124; []).length, | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:515:33 | rows: (block.content.rows &#124;&#124; []).length, | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:516:35 | tiers: (block.content.tiers &#124;&#124; []).length, | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:517:35 | steps: (block.content.steps &#124;&#124; []).length, | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:518:35 | pairs: (block.content.pairs &#124;&#124; []).length, | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:519:37 | panels: (block.content.panels &#124;&#124; []).length, | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:520:39 | columns: (block.content.columns &#124;&#124; []).length, | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:521:35 | parts: (block.content.parts &#124;&#124; []).length, | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:522:57 | linesPerSide: Math.max(0, ...(block.content.sides &#124;&#124; []).map((s) => (s.lines &#124;&#124; []).length)), | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:522:84 | linesPerSide: Math.max(0, ...(block.content.sides &#124;&#124; []).map((s) => (s.lines &#124;&#124; []).length)), | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:523:57 | nodesPerLane: Math.max(0, ...(block.content.lanes &#124;&#124; []).map((l) => (l.nodes &#124;&#124; []).length)), | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:523:84 | nodesPerLane: Math.max(0, ...(block.content.lanes &#124;&#124; []).map((l) => (l.nodes &#124;&#124; []).length)), | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:524:59 | itemsPerPanel: Math.max(0, ...(block.content.panels &#124;&#124; []).map((p) => (p.items &#124;&#124; []).length)), | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:524:86 | itemsPerPanel: Math.max(0, ...(block.content.panels &#124;&#124; []).map((p) => (p.items &#124;&#124; []).length)), | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:562:12 | } else if (!argv[i].startsWith('--')) { | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:595:3 | if (!content &#124;&#124; content.type !== 'flow' &#124;&#124; !Array.isArray(content.lanes)) return { block, notes }; | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:599:5 | if (!Array.isArray(lane.nodes)) return; | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:601:7 | if (!entry &#124;&#124; typeof entry !== 'object') return entry; | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:618:3 | if (!args.block) { | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:631:34 | const planBlock = (plan.blocks &#124;&#124; []).find((b) => b.id === block.id) &#124;&#124; {}; | no | Compliant | 合法 fallback，不改：content.type 决定合法数组形状；不存在的其他 shape 数组不是 Unknown。错误/CLI 分支不承载认识论状态。 |
| scripts/check-block.js:643:69 | const originProv = result.elements.filter((e) => (e.sourceUnitIds &#124;&#124; []).length === 0).length; | no | Compliant | 合法 fallback，不改：检查已提交 expression 的 provenance 声明；semantic 缺声明 HARD、presentation 豁免；不创造 Evidence。未分类字段不在此 walker，另记无边界。 |
| scripts/assemble-overview.js:40:5 | if (!argv[i].startsWith('--')) continue; | no | Compliant | 合法 fallback，不改：CLI 参数开关判断，无知识状态。 |
| scripts/assemble-overview.js:71:31 | (design.overview.sections &#124;&#124; []).map((s) => [s.id, { title: s.title, purpose: s.purpose }]) | no | Compliant | 合法 fallback，不改：已声明 stage 元数据/Plan required sourceRefs 展开，非 Unknown carrier。 |
| scripts/assemble-overview.js:85:5 | if (!fs.existsSync(generatedFile)) { | no | Compliant | 合法 fallback，不改：文件不存在显式登记到 missingBlocks，保留 Known Missing；Generated artifact 不含该 expression 不等于 Plan identity 不存在（P6）。 |
| scripts/assemble-overview.js:94:5 | if (!metadata.model && request.model) metadata.model = request.model; | no | Compliant | 合法 fallback，不改：汇总首个可得 model 元数据；没有将缺值解释为零、正常或 claim verified。 |
| scripts/assemble-overview.js:95:5 | if (!metadata.promptSha256 && request.promptSha256) metadata.promptSha256 = request.promptSha256; | no | Compliant | 合法 fallback，不改：汇总首个可得 prompt hash；没有将缺值解释为已验证。 |
| scripts/assemble-overview.js:109:55 | const sources = [...new Set((planBlock.sourceRefs &#124;&#124; []).map((r) => r.section))]; | no | Compliant | 合法 fallback，不改：已声明 stage 元数据/Plan required sourceRefs 展开，非 Unknown carrier。 |
| scripts/build-preview.js:35:5 | if (!argv[i].startsWith('--')) continue; | no | Compliant | 合法 fallback，不改：CLI 参数开关判断，无知识状态。 |
| scripts/build-preview.js:63:44 | const meta = (design.overview.sections &#124;&#124; []).find((s) => s.id === stageId) &#124;&#124; {}; | no | Compliant | 合法 fallback，不改：stage 元数据/Plan sourceRefs 展开；Generated 主导集合是独立 authority divergence，不是此表达式的三态 carrier。 |
| scripts/build-preview.js:72:55 | sources: [...new Set(((pb && pb.sourceRefs) &#124;&#124; []).map((r) => r.section))], | no | Compliant | 合法 fallback，不改：stage 元数据/Plan sourceRefs 展开；Generated 主导集合是独立 authority divergence，不是此表达式的三态 carrier。 |
| app/renderer/l0-map.js:80:3 | if (!nested) { | no | Compliant | 合法 fallback，不改：显示已声明来源/附件、qualifier 可选样式或 DOM disclosure 控制；不输出 claim verification。 |
| app/renderer/l0-map.js:94:22 | const list = (refs &#124;&#124; []).filter(Boolean); | no | Compliant | 合法 fallback，不改：显示已声明来源/附件、qualifier 可选样式或 DOM disclosure 控制；不输出 claim verification。 |
| app/renderer/l0-map.js:95:3 | if (!list.length) return '<span class="muted">（无出处）</span>'; | no | Compliant | 合法 fallback，不改：显示已声明来源/附件、qualifier 可选样式或 DOM disclosure 控制；不输出 claim verification。 |
| app/renderer/l0-map.js:102:3 | if (!q) return null; | no | Compliant | 合法 fallback，不改：显示已声明来源/附件、qualifier 可选样式或 DOM disclosure 控制；不输出 claim verification。 |
| app/renderer/l0-map.js:144:31 | const a = (vm.attachments &#124;&#124; []).find((x) => x.elementId === id); | no | Compliant | 合法 fallback，不改：显示已声明来源/附件、qualifier 可选样式或 DOM disclosure 控制；不输出 claim verification。 |
| app/renderer/l0-map.js:145:25 | return a ? (a.hosts &#124;&#124; []).join(',') : ''; | no | Compliant | 合法 fallback，不改：显示已声明来源/附件、qualifier 可选样式或 DOM disclosure 控制；不输出 claim verification。 |
| app/renderer/l0-map.js:458:3 | if (!root &#124;&#124; root.__l0Bound) return; | no | Compliant | 合法 fallback，不改：显示已声明来源/附件、qualifier 可选样式或 DOM disclosure 控制；不输出 claim verification。 |
| app/renderer/l0-map.js:551:7 | if (!inSummary) ev.preventDefault(); | no | Compliant | 合法 fallback，不改：显示已声明来源/附件、qualifier 可选样式或 DOM disclosure 控制；不输出 claim verification。 |
| app/renderer/l0-map.js:557:7 | if (!inSummary) ev.preventDefault(); | no | Compliant | 合法 fallback，不改：显示已声明来源/附件、qualifier 可选样式或 DOM disclosure 控制；不输出 claim verification。 |
| app/renderer/l0-layout.js:67:3 | if (!raw) return { title: String((el && el.id) &#124;&#124; ''), subtitle: '' }; | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:115:29 | const ns = (rel.get(id) &#124;&#124; []).filter((x) => refPos.has(x)); | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:116:5 | if (!ns.length) return null; | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:125:5 | if (!down) idxs.reverse(); | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:128:7 | if (!refLayer) continue; | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:166:40 | const elements = (vm && vm.elements) &#124;&#124; []; | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:167:37 | const allEdges = (vm && vm.edges) &#124;&#124; []; | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:168:46 | const attachments = (vm && vm.attachments) &#124;&#124; []; | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:183:86 | if (a && a.elementId && byId.has(a.elementId)) hostsOf.set(a.elementId, (a.hosts &#124;&#124; []).slice()); | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:186:37 | hostsOf.forEach((_hosts, id) => { if (!onEdge.has(id)) badgeOnly.add(id); }); | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:190:37 | const hosts = hostsOf.get(id) &#124;&#124; []; | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:192:7 | if (!anchored) { badgeOnly.delete(id); changed = true; } | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:194:5 | if (!changed) break; | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:207:5 | if (!cardSet.has(ed.from) &#124;&#124; !cardSet.has(ed.to)) { skippedEdges += 1; continue; } | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:225:34 | for (const w of adj.get(v) &#124;&#124; []) if (!seen.has(w)) { seen.add(w); queue.push(w); } | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:225:41 | for (const w of adj.get(v) &#124;&#124; []) if (!seen.has(w)) { seen.add(w); queue.push(w); } | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:268:34 | const c = color.get(w) &#124;&#124; 0; | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:299:28 | comp.forEach((id) => { if (!rank.has(id)) rank.set(id, 0); }); // 兜底（理论上不可达） | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:304:7 | if (!layers.has(r)) layers.set(r, []); | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:351:42 | const badgeIds = (e.attachmentAsHost &#124;&#124; []).map((a) => a.elementId); | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:365:40 | badgeLabels: (e.attachmentAsHost &#124;&#124; []).map((a) => a.elementLabel &#124;&#124; a.elementId), | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:376:23 | hosts: (a.hosts &#124;&#124; []).slice(), | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/l0-layout.js:386:5 | if (!a &#124;&#124; !b) { skippedEdges += 1; continue; } | no | Compliant | 合法 fallback，不改：邻接表、DFS 颜色、坐标层或 attachment 展示布局；只决定位置/表示，无知识状态字段。 |
| app/renderer/app.js:134:33 | return (state.model.decisions &#124;&#124; []).find((d) => d.id === id) &#124;&#124; null; | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:138:37 | return (state.model.openQuestions &#124;&#124; []).find((q) => q.id === id) &#124;&#124; null; | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:150:3 | if (!state.model) return { ready: false, blockers: [] }; | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:155:3 | if (!state.model) return null; | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:169:10 | (chips &#124;&#124; []).forEach((id) => { | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:180:18 | (block.sources &#124;&#124; []).forEach((label) => { | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:194:18 | (content.parts &#124;&#124; []).forEach((part) => { | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:204:18 | (content.lanes &#124;&#124; []).forEach((lane) => { | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:207:17 | (lane.nodes &#124;&#124; []).forEach((item, index) => { | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:233:18 | (content.tiers &#124;&#124; []).forEach((tier) => { | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:249:35 | const columns = content.columns &#124;&#124; []; | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:257:17 | (content.rows &#124;&#124; []).forEach((row) => { | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:285:16 | (panel.items &#124;&#124; []).forEach((item) => { | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:297:33 | const panels = content.panels &#124;&#124; []; | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:309:18 | (content.steps &#124;&#124; []).forEach((step, index) => { | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:330:18 | (content.pairs &#124;&#124; []).forEach((pair) => { | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:335:41 | const variant = (pair.keyVariants &#124;&#124; [])[index]; | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:352:18 | (content.sides &#124;&#124; []).forEach((side) => { | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:355:17 | (side.lines &#124;&#124; []).forEach((line) => { | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:468:3 | if (!block) return; | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:481:3 | if (!container &#124;&#124; state.scrollSpyReady) return; | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:523:3 | if (!result &#124;&#124; !result.ok) { | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:563:3 | if (!section) { | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:588:3 | if (!state.humanReview.decisions) state.humanReview.decisions = {}; | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:589:3 | if (!state.humanReview.decisions[id]) state.humanReview.decisions[id] = { status: 'pending', comment: '' }; | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:609:3 | if (!items &#124;&#124; items.length === 0) return el('div', 'muted small', emptyText &#124;&#124; '（空）'); | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:652:3 | if (!evidence &#124;&#124; evidence.length === 0) { | no | Compliant | 合法 fallback，不改：schema required evidence 数组，空表示没有 evidence，不表示 claim 未验证或 Unknown。 |
| app/renderer/app.js:731:5 | if (!state.humanReview.openQuestions) state.humanReview.openQuestions = {}; | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:810:5 | if (!commentOf(d.id)) { | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:818:94 | disclosureSection('decision', d.id, 'alternatives', 'Alternatives', &#96;${(d.alternatives &#124;&#124; []).length} 项&#96;, (body) => { | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:823:90 | disclosureSection('decision', d.id, 'rationale', 'Full Rationale', &#96;${(d.rationale &#124;&#124; []).length} 条&#96;, (body) => { | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:828:94 | disclosureSection('decision', d.id, 'consequences', 'Consequences', &#96;${(d.consequences &#124;&#124; []).length} 条&#96;, (body) => { | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:843:82 | disclosureSection('decision', d.id, 'evidence', 'Evidence', &#96;${(d.evidence &#124;&#124; []).length} 条&#96;, (body) => { | no | Compliant | 合法 fallback，不改：schema required evidence 数组，空表示没有 evidence，不表示 claim 未验证或 Unknown。 |
| app/renderer/app.js:857:43 | const questions = (d.relatedQuestions &#124;&#124; []).map((id) => questionById(id)).filter(Boolean); | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:870:26 | if ((d.dependsOn &#124;&#124; []).length > 0) { | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:899:24 | if ((d.affects &#124;&#124; []).length > 0) body.appendChild(fieldBlock('Affects', bulletList(d.affects))); | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:921:53 | const warningCount = (state.model.design.warnings &#124;&#124; []).length; | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:926:34 | (state.model.design.warnings &#124;&#124; []).forEach((w) => ul.appendChild(el('li', '', w))); | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:931:43 | const decisions = state.model.decisions &#124;&#124; []; | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:986:3 | if (!state.model && state.view !== 'l0') return; | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:1023:3 | if (!state.l0ViewModel) { | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:1055:3 | if (!res &#124;&#124; !res.ok) { | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:1089:11 | (errors &#124;&#124; []).forEach((e) => ul.appendChild(el('li', '', e))); | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:1101:3 | if (!result) return { applied: false, reason: 'empty-result' }; | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:1103:3 | if (!result.ok) { | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:1121:49 | state.model.design.warnings = result.warnings &#124;&#124; []; | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:1134:39 | decisions: (state.model.decisions &#124;&#124; []).length, | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:1136:29 | gaps: (state.model.gaps &#124;&#124; []).length, | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:1137:47 | openQuestions: (state.model.openQuestions &#124;&#124; []).length, | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:1206:5 | if (!target &#124;&#124; !target.closest) return; | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:1213:7 | if (!state.humanReview[bucket]) state.humanReview[bucket] = {}; | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:1235:5 | if (!result.ok) { | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:1236:36 | toast(&#96;保存失败：${(result.errors &#124;&#124; []).join('; ')}&#96;, true); | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:1275:7 | if (!state.model) { | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:1287:5 | if (!action) return; | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/renderer/app.js:1288:45 | const decisions = state.model.decisions &#124;&#124; []; | no | Compliant | 合法 fallback，不改：经 design schema 验证的模型/按 content.type 渲染的已声明列表；缺失非法 required 字段不被当合法 Unknown 输入。 |
| app/renderer/app.js:1290:5 | if (!target) { | no | Compliant | 合法 fallback，不改：DOM/模型是否已加载、UI 操作目标、显示样式或错误结果分支，无 capability 三态写回。 |
| app/shared/semantics.js:70:29 | return (model.decisions &#124;&#124; []).filter((d) => reviewLevelOf(d) === 'root'); | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:74:29 | return (model.decisions &#124;&#124; []).filter((d) => reviewLevelOf(d) !== 'root'); | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:82:39 | const decisions = model.decisions &#124;&#124; []; | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:88:7 | if (!other &#124;&#124; seen.has(other.id)) return; | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:93:25 | (decision.dependsOn &#124;&#124; []).forEach((id) => { | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:97:7 | if (!anchor) return; | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:100:30 | if ((other.dependsOn &#124;&#124; []).includes(anchor.id)) push(other, 'sibling'); | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:105:28 | if ((other.dependsOn &#124;&#124; []).includes(decision.id)) push(other, 'downstream'); | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:114:45 | const byId = new Map((model.decisions &#124;&#124; []).map((d) => [d.id, d])); | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:119:28 | (current.dependsOn &#124;&#124; []).forEach((id) => { | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:147:5 | if (!isBlockingCategory(categoryOf(question))) return false; | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:153:33 | return (model.openQuestions &#124;&#124; []).filter((q) => | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:160:33 | return (model.openQuestions &#124;&#124; []).filter( | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:172:27 | const list = evidence &#124;&#124; []; | no | Compliant | 合法 fallback，不改：review-object evidence 是 required array，合法状态只有 Known(0)/Known(n)，不允许 Projection 发明 Unknown。 |
| app/shared/semantics.js:221:35 | return (decision.consequences &#124;&#124; []).slice(0, max); | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:226:47 | return Math.max(0, (decision.consequences &#124;&#124; []).length - max); | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:232:38 | const byId = new Map((model.gaps &#124;&#124; []).map((g) => [g.id, g])); | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:233:44 | const explicit = (decision.relatedGaps &#124;&#124; []).map((id) => byId.get(id)).filter(Boolean); | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:238:24 | return (model.gaps &#124;&#124; []) | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:239:42 | .filter((g) => (g.relatedDecisions &#124;&#124; []).includes(decision.id)) | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:244:24 | return (model.gaps &#124;&#124; []) | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:269:29 | (designReview.decisions &#124;&#124; []).forEach((d) => { | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:283:33 | (designReview.openQuestions &#124;&#124; []).forEach((q) => { | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:285:7 | if (!isQuestionBlocking(q, status)) return; | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:295:24 | (designReview.gaps &#124;&#124; []).forEach((g) => { | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:312:29 | (designReview.decisions &#124;&#124; []).forEach((d) => { | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:316:33 | (designReview.openQuestions &#124;&#124; []).forEach((q) => { | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:320:24 | (designReview.gaps &#124;&#124; []).forEach((g) => { | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:342:38 | .sort((a, b) => (a.dependsOn &#124;&#124; []).length - (b.dependsOn &#124;&#124; []).length); | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:342:67 | .sort((a, b) => (a.dependsOn &#124;&#124; []).length - (b.dependsOn &#124;&#124; []).length); | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:365:40 | const unresolvedGaps = (model.gaps &#124;&#124; []).filter((g) => { | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:399:39 | const decisions = model.decisions &#124;&#124; []; | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:403:40 | counts[status] = (counts[status] &#124;&#124; 0) + 1; | no | Compliant | 合法 fallback，不改：本次已知 review 集合的局部计数初始化，不是未知数量。 |
| app/shared/semantics.js:411:29 | const gaps = model.gaps &#124;&#124; []; | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:415:46 | gapCounts[status] = (gapCounts[status] &#124;&#124; 0) + 1; | no | Compliant | 合法 fallback，不改：本次已知 review 集合的局部计数初始化，不是未知数量。 |
| app/shared/semantics.js:429:37 | total: (model.openQuestions &#124;&#124; []).length, | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |
| app/shared/semantics.js:433:48 | acc[category] = (model.openQuestions &#124;&#124; []).filter((q) => categoryOf(q) === category).length; | no | Compliant | 合法 fallback，不改：review carrier 的已声明外键/数组、人工状态或控制流；不是 Reading capability Unknown 的编码。 |

额外定点检查：role 缺省的实际实现是 scripts/assemble-overview.js:116 的三元表达式，而非字面 ?? normal；ai/stage2-blocks.prompt.md:171 明确其缺省，不进 S1 backlog。
