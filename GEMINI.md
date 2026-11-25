# GEMINI.md

@./AGENTS.md

## Gemini 補充

- Gemini CLI 預設讀取本檔，本檔再匯入 `AGENTS.md`；規範以 `AGENTS.md` 為準。不要另外把 `AGENTS.md` 設為 context 檔，否則會重複載入。
- 在本專案中 Gemini **只擔任審查者**（Google AI Plus 網頁版，每次新對話；2026-11-25）。審查資料由 `pnpm review-pack` 產生，見 `docs/prompts/AI工具與上下文.md`。
