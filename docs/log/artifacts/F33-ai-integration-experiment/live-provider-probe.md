# F33 Live Provider Probe

Date: 2026-11-10

No secret values were recorded.

- The configured `OPENAI_BASE_URL` model inventory was reachable, but listed only GPT-family text models and image models; it did not list a DeepSeek model.
- The configured `DASHSCOPE_HTTP_BASE_URL` is a custom `/api/v1` endpoint. TLS validation failed in the local client; a certificate-bypassed, eight-token probe to the OpenAI-compatible `/chat/completions` path returned HTTP 404 with an empty body.
- No complete live generation was started and no GPT result is being presented as DeepSeek evidence.

F33 therefore remains active, not passing. Offline driver/evaluation work can proceed, but the required two-document × two-run DeepSeek experiment needs a working compatible DeepSeek endpoint/model identifier and an agreed budget.
