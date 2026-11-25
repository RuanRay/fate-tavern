# CLAUDE.md

@AGENTS.md

## Claude Code 補充

- 開始任務前先用 Plan Mode 產出計畫，經人類確認後才改檔（AGENTS.md §5）。
- 需要大範圍搜尋時可以用子代理，但**審查不能由同一個 Claude 工作階段自己做**；審查交給 Gemini（見 `docs/review/審查流程.md`、`docs/prompts/AI工具與上下文.md`）。
- 一個任務做完就 `/clear` 開新工作階段；不准讀 `.env*`、`*.pem`（`.claude/settings.json` 已擋）。
- 每完成一個需求 ID 就停下來回報，不要一口氣做完整個階段。
