# CLAUDE.md

@AGENTS.md

## Claude Code 補充

- 開始任務前先用 Plan Mode 產出計畫，經人類確認後才改檔（AGENTS.md §5）。
- 需要大範圍搜尋時可以用子代理，但**審查不能由同一個 Claude 工作階段自己做**；審查交給 Gemini（見 `docs/review/審查流程.md`、`docs/prompts/AI工具與上下文.md`）。
- 開 PR、交給 Gemini 審查時，**同時給人類可直接貼上的審查提示詞**：以 `docs/review/審查提示詞.md` 對應節為底，填好 PR 編號、任務／需求 ID、風險等級、要檢查的清單領域，並列出要附上的檔案（文件 PR 改寫成文件一致性審查）。
- 一個任務做完就 `/clear` 開新工作階段；不准讀 `.env*`、`*.pem`（`.claude/settings.json` 已擋）。
- 每完成一個需求 ID 就停下來回報，不要一口氣做完整個階段。
