{
  "shape": "checklist",
  "content": {
    "type": "checklist",
    "panels": [
      {
        "title": "Receipt 不等于 Availability 或 Consumption",
        "variant": "warn",
        "items": [
          {
            "text": "收到或保存上下文，只能证明 Receipt",
            "note": "Proposal 到达 HTTP 或消息入口、响应被写入日志或保存到 session、上下文对象出现在内存或数据库中，以及生成接口参数中存在 context 字段，都不能证明 Availability 或 Consumption。",
            "variant": "warn",
            "sourceUnitIds": [
              "SU-015"
            ]
          },
          {
            "text": "Receipt 存在，不代表上下文可用于本次生成",
            "note": "Proposal 版本未知、请求 lineage 不一致、引用越权或冻结失败时，系统仍可能有 Receipt，但不能继续声称 Availability。",
            "variant": "bad",
            "sourceUnitIds": [
              "SU-016"
            ]
          },
          {
            "text": "上下文看似完整，也可能没有 Availability",
            "note": "包括 digest 与当前请求不一致、知识引用越权、Frozen Context 尚未成功创建、context 属于旧 revision、浏览器提交的上下文未经服务器授权，或生成请求已切换到另一个 lesson session。",
            "variant": "bad",
            "sourceUnitIds": [
              "SU-020"
            ]
          },
          {
            "text": "生成链路出现 context 痕迹，不能单独证明 Consumption",
            "note": "Proposal 被成功接收、Frozen Context 被成功保存、context 出现在生成请求参数中或被原样附加到 Prompt、Prompt 长度增加、生成接口成功返回 outline，以及输出偶然出现 Proposal 关键词，都不是充分条件。",
            "variant": "warn",
            "sourceUnitIds": [
              "SU-026"
            ]
          }
        ]
      },
      {
        "title": "七类代码情况仍不能直接声称 Consumption",
        "variant": "bad",
        "items": [
          {
            "text": "冻结成功，但 outline generation 未读取投影",
            "note": "freezeFormalFusionForOutline() 成功保存 frozenLessonGenerationContext，仍不能证明教学语义被实际用于课程设计。",
            "variant": "bad",
            "sourceUnitIds": [
              "SU-065"
            ]
          },
          {
            "text": "恢复成功，但生成器仍使用普通输入",
            "note": "resolveFormalFusion() 成功恢复 context，但生成器继续使用普通 requirements 和默认模板。",
            "variant": "bad",
            "sourceUnitIds": [
              "SU-066"
            ]
          },
          {
            "text": "完成投影，但只生成 lineage 元数据",
            "note": "projectFormalGenerationContext() 被调用，却没有把教学目标、范围或 guidance 转化为设计输入。",
            "variant": "bad",
            "sourceUnitIds": [
              "SU-067"
            ]
          },
          {
            "text": "Prompt 包含 context，但 orchestration 未要求依据其设计",
            "note": "appendFormalTeachingPrompt() 返回包含 context 文本的 Prompt，不等于 outline generation 消费了其中的教学语义。",
            "variant": "bad",
            "sourceUnitIds": [
              "SU-068"
            ]
          },
          {
            "text": "scene-content prompt 使用 context，不等于 outline generation 消费",
            "note": "formal context 出现在 scene-content prompt 中，但 outline generation 本身没有消费它。",
            "variant": "bad",
            "sourceUnitIds": [
              "SU-069"
            ]
          },
          {
            "text": "浏览器输入与服务器 context 不一致，且服务端未以存储内容为权威",
            "note": "浏览器提交的 outline、mapping、digest 或 guidance 与服务器 context 不一致时，不能据此声称 Consumption。",
            "variant": "bad",
            "sourceUnitIds": [
              "SU-070"
            ]
          },
          {
            "text": "自动追加 checkpoint/remediation pair，不证明普通生成已消费语义",
            "note": "completeFormalLessonOutlines() 的追加行为不能证明普通 outline generation 消费了 DeepTutor 语义。",
            "variant": "bad",
            "sourceUnitIds": [
              "SU-071"
            ]
          }
        ]
      },
      {
        "title": "升级为 Consumption 的证据边界",
        "variant": "info",
        "items": [
          {
            "text": "函数调用、Prompt 字符串或生成结果存在，都不能作为升级依据",
            "note": "这些现象可以分别表示 Receipt 或 Availability，但不能仅凭其存在就升级为 Consumption。",
            "variant": "warn",
            "sourceUnitIds": [
              "SU-072"
            ]
          },
          {
            "text": "Prompt 可以承载 Consumption，但不是产品定义或充分条件",
            "note": "需要证明教学语义成为 outline-design task 的真实输入，而不是装饰性文本或未使用附件。",
            "variant": "info",
            "sourceUnitIds": [
              "SU-026",
              "SU-072"
            ]
          }
        ]
      }
    ],
    "note": "Proposal、Frozen Context、函数调用、Prompt 文本和生成结果的存在，均不能单独证明 Context Consumption。"
  }
}