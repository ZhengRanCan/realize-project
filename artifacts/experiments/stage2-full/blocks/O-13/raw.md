{
  "shape": "combo",
  "content": {
    "type": "combo",
    "caption": "分别报告 Context-side chain 与 Output-side chain 的状态",
    "pairs": [
      {
        "key": "否 / 否 / 否 / 不可归因或失败",
        "keyVariants": ["bad", "bad", "bad", "bad"],
        "value": "上下文没有到达，不能声称 DeepTutor 参与。",
        "variant": "bad",
        "sourceUnitIds": ["SU-037", "SU-036"]
      },
      {
        "key": "是 / 否 / 否 / 不可归因或失败",
        "keyVariants": ["ok", "bad", "bad", "bad"],
        "value": "收到上下文，但未形成合法可用上下文。",
        "variant": "bad",
        "sourceUnitIds": ["SU-037"]
      },
      {
        "key": "是 / 是 / 否 / 可能表面成功",
        "keyVariants": ["ok", "ok", "bad", "warn"],
        "value": "上下文可用但未实际参与生成；不能声称 context-grounded generation。",
        "variant": "warn",
        "sourceUnitIds": ["SU-037"]
      },
      {
        "key": "是 / 是 / 是 / 未通过",
        "keyVariants": ["ok", "ok", "ok", "bad"],
        "value": "上下文参与了生成，但最终课程没有充分体现相关语义。",
        "variant": "warn",
        "sourceUnitIds": ["SU-037"]
      },
      {
        "key": "是 / 是 / 是 / 通过或带 warning",
        "keyVariants": ["ok", "ok", "ok", "ok"],
        "value": "形成完整的 context-grounded generation 证据；仍然不证明 DeepTutor 判断一定正确、课程一定有效、学生一定学会，或某个输出变化严格由 DeepTutor 导致。",
        "variant": "ok",
        "sourceUnitIds": ["SU-037", "SU-038"]
      }
    ],
    "note": "两条链的状态不需要压缩成一个不可解释的“个性化成功”布尔值。"
  }
}