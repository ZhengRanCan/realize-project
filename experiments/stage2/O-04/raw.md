{
  "shape": "current-target-flow",
  "content": {
    "type": "flow",
    "lanes": [
      {
        "label": "当前链路",
        "variant": "current",
        "sourceUnitIds": [
          "SU-044"
        ],
        "nodes": [
          {
            "node": {
              "title": "课前 outline 入口",
              "detail": "解析课程生成请求，并进入正式 Fusion context 的冻结或恢复流程。",
              "state": "current",
              "code": "app/api/generate/scene-outlines-stream/route.ts",
              "sourceUnitIds": [
                "SU-044"
              ]
            },
            "edge": {
              "kind": "plain",
              "note": "调用 freezeFormalFusionForOutline() 或恢复已冻结 context，追加 generation projection，调用 outline LLM stream，并解析、规范化和持久化 outline。",
              "sourceUnitIds": [
                "SU-045"
              ]
            }
          },
          {
            "node": {
              "title": "现有 generation projection",
              "detail": "FormalGenerationContextProjection 已存在，并由 appendFormalTeachingPrompt() 渲染为 Frozen lesson guidance。",
              "state": "current",
              "code": "lib/fusion/generation-session.ts",
              "sourceUnitIds": [
                "SU-047"
              ]
            },
            "edge": {
              "kind": "plain",
              "note": "当前小型投影已进入 outline generation 输入，可作为现有起点。",
              "sourceUnitIds": [
                "SU-047"
              ]
            }
          },
          {
            "node": {
              "title": "scene prompt 仍直接附加 formal context",
              "detail": "正式 Fusion scene-content route 会恢复服务器存储的 outline，并调用 appendFormalTeachingPrompt()。",
              "state": "changed",
              "sourceUnitIds": [
                "SU-053"
              ]
            },
            "edge": {
              "kind": "problem",
              "note": "代码上仍存在 scene prompt 直接附加 formal context 的路径。",
              "sourceUnitIds": [
                "SU-053"
              ]
            }
          }
        ]
      },
      {
        "label": "目标链路",
        "variant": "target",
        "sourceUnitIds": [
          "SU-046"
        ],
        "nodes": [
          {
            "node": {
              "title": "outline generation 承担主要消费职责",
              "detail": "freeze/resolve → outline generation route → server-derived generation projection → outline prompt 或等价 planner input → outline stream / Outline Generation Attempt → outline 持久化。",
              "state": "changed",
              "sourceUnitIds": [
                "SU-046"
              ]
            },
            "edge": {
              "kind": "changed",
              "note": "现有路径应收敛为 FrozenLessonGenerationContext → outline generation projection → context-shaped Outline Revision → scene generation from authoritative outline。",
              "sourceUnitIds": [
                "SU-054"
              ]
            }
          },
          {
            "node": {
              "title": "context-shaped Outline Revision",
              "detail": "冻结教学语义先投影到 outline generation，由权威 outline 承接后续 scene generation。",
              "state": "target",
              "sourceUnitIds": [
                "SU-054"
              ]
            },
            "edge": {
              "kind": "plain",
              "note": "Scene generation 可以继承必要的 context lineage、outline revision 和由 outline 派生的局部设计约束。",
              "sourceUnitIds": [
                "SU-055"
              ]
            }
          },
          {
            "node": {
              "title": "scene generation 消费权威 outline",
              "detail": "主要消费对象应是 context-shaped outline，而不是完整 Frozen Context。",
              "state": "target",
              "sourceUnitIds": [
                "SU-056"
              ]
            },
            "edge": {
              "kind": "problem",
              "note": "不应重新读取完整 raw Proposal、learner projection、DeepTutor 内部响应或另一个 context revision。",
              "sourceUnitIds": [
                "SU-055"
              ]
            }
          }
        ]
      }
    ]
  }
}