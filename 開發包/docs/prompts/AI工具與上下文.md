# 命運酒館｜AI 工具、預算與上下文打包 v1.0

> 更新日期：2026-11-25（v1.0：定案）
> 用途：實作與審查各用哪個 AI、每月花多少、程式碼可以送到哪裡、每次交給 AI 要附哪些文件、用量用完怎麼辦。
> 依據：《審查流程》、《CI 與分支規則》、《提示詞範本》、《工作清單》。

---

## 1. 工具與費用

| 工具 | 方案 | 月費 | 角色 |
|---|---|---|---|
| Claude（含 Claude Code） | Pro | US$20（約 NT$650，依匯率） | **實作**：Claude Code 在終端機寫程式；claude.ai 專案用於規劃與設計問題 |
| Gemini | Google AI Plus | NT$260 | **審查**：所有 PR 審查都在 Gemini 網頁版做 |
| **合計** | | **約 NT$910** | 預算 1,000 以下 |

- Claude Pro 的用量是 Claude 對話、Claude Code 共用一個額度，有「每 5 小時」與「每週」兩種上限；在 Claude Code 輸入 `/status` 可以看剩多少。
- Google AI Plus 的 Gemini 單一對話上限約 128k 詞元，Pro 模型每天約 30 次提問（以 Google 公告為準）；所以送審的資料要控制在約 **80k 詞元**以內（第 4 節）。
- 價格與額度會變動；每季（1、4、7、10 月）檢查一次兩邊官網，有變動就更新本表。

## 2. 分工

| 工作 | 工具 |
|---|---|
| 寫程式、寫測試、跑檢查、開 PR | Claude Code（預設模型用 Sonnet；🔴 任務的計畫階段可以切 Opus，但會更快用完額度） |
| 細拆下一個里程碑的任務、回答【需要決定】 | claude.ai（命運酒館專案） |
| PR 審查 | Gemini（Google AI Plus），每次開**新對話** |
| 設計文件的交叉檢查 | 你目前的習慣照舊（Codex、Cursor、DeepSeek 等）；**只送設計文件，不送程式碼**（第 3 節） |

### 2-1 審查規則（2026-11-25 依「實作 Claude／審查 Gemini」調整）

| 等級 | 審查 |
|---|---|
| 🟢、🟡 | Gemini 新對話 1 次，用《審查提示詞》§1 |
| 🔴 | Gemini **兩個不同的新對話**：① 一般審查（審查提示詞 §1）；② 規則與安全專審（審查提示詞 §5），**第二個對話不給它看第一份報告**；再加 12 小時冷卻（CI 與分支規則 §1-1） |
| 卡牌、設定內容 | Gemini 內容比對（審查提示詞 §2） |

- 實作（Anthropic）與審查（Google）是不同廠商的模型，符合「寫程式的 AI ≠ 審查的 AI」。
- 🔴 的兩份審查是同一個工具，盲點可能重疊；所以第二份刻意用不同的檢查角度，並保留你的「人類最後檢查」與隔天再看。

## 3. 資料可以送到哪裡

| 內容 | 可以送 | 不可以送 |
|---|---|---|
| 程式碼、PR diff、測試、CI 紀錄 | Claude Pro、Google AI Plus（付費方案） | 任何免費方案或其他服務 |
| 設計文件（`docs/design/`、`docs/phases/`…） | 上述兩個，以及你用來交叉檢查的工具 | — |
| `.env`、Token、密碼、資料庫內容、遙測原始資料 | **都不送** | 全部 |

- **開工前要做**：到兩邊的隱私設定確認對話不用於模型訓練——Claude 的隱私設定（是否用於改進模型）、Gemini 的「Gemini 應用程式活動記錄」。付費方案不一定預設關閉，以你看到的設定為準。
- `tools/review-pack` 產生審查資料時，自動排除 `.env*`、`*.pem`、`infra/secrets/`，並掃描疑似 Token 的字串（第 4 節）。

## 4. 上下文打包

### 4-1 給 Claude Code（實作）

Claude Code 會自己讀 repo，所以只要在 Issue 寫清楚：

```
任務：T-M?-??（需求 M?-R??）
必讀：AGENTS.md；docs/phases/M?_….md §3、§6；docs/design/<文件> §<章節>（列出章節，不要整份）
範圍：只能改 <資料夾>
驗收：M?-A??
```

- `CLAUDE.md` 匯入 `AGENTS.md`；每次開新工作階段先讀 Issue，再照《提示詞範本》§1 先出計畫。
- 一個任務做完就開新工作階段（`/clear`），避免上一個任務的脈絡占用額度、也避免混進無關修改。

### 4-2 給 Gemini（審查）：`tools/review-pack`

```
pnpm review-pack <PR 編號> [--focus general|rules-security|content]
→ 產生 review-pack/PR-<編號>-<focus>.md（不進 repo）
```

| 內容 | 來源 |
|---|---|
| 審查提示詞 | `docs/review/審查提示詞.md` 對應的那一節 |
| 規範 | `AGENTS.md` §3、§4 |
| 審查清單 | 通用 G＋依改到的路徑自動選 R／P／S／D／F／GD／X |
| 需求 | Issue 內「必讀」列出的章節（只抓那些章節） |
| 變更 | PR diff（排除產生檔、`pnpm-lock.yaml`） |
| CI | `pr.yml` 各檢查結果摘要 |

- 大小超過約 80k 詞元就停下來並提示：拆 PR，或用 `--files` 分批審查。
- 你把產生的檔案上傳或貼到 Gemini 新對話；Gemini 的報告貼回 PR 留言（`review-gate` 讀它）。報告開頭要有「審查工具：Gemini（Google AI Plus）」與「審查重點：一般／規則與安全／內容」。

## 5. 用量用完時

| 情況 | 做法 |
|---|---|
| Claude 5 小時上限用完 | 改做不需要 Claude 的事：用 Gemini 審查已開的 PR、實機測試（iPhone 13、DevTools 模擬）、寫或整理 Issue、跑每晚檢查失敗的重現 |
| Claude 每週上限用完 | 同上；該週剩下的時間做審查、測試與下一個任務的規劃 |
| Gemini 當天提問次數用完 | PR 留到隔天審（🔴 本來就要等 12 小時） |
| 連續 3 週以上被上限卡住超過 1/3 的時間 | 回報並重新討論預算（例如升級方案），不自行加錢 |

- 不開超額付費（使用額度用完就等重置，2026-11-25 決定）。

## 6. Claude Code 的設定（`.claude/settings.json`）

| 設定 | 內容 |
|---|---|
| 禁止讀取 | `.env*`、`*.pem`、`infra/secrets/**` |
| 需要你確認 | `git push`、`rm -rf`、`pnpm add`（新增依賴）、改 `docs/design/**` |
| 禁止 | `git push --force`、`git push origin main` |

## 7. 確認紀錄（2026-11-25）

| # | 問題 | 決定 |
|---|---|---|
| AI1 | 用哪些工具 | Claude Pro（含 Claude Code）＋Google AI Plus；每月約 NT$910 |
| AI2 | 誰實作、誰審查 | **實作 Claude、審查 Gemini**；🔴 用兩個不同的 Gemini 新對話（一般＋規則與安全），第二個看不到第一份報告 |
| AI3 | 資料外送 | 設計文件可以送任何工具；程式碼只送付費方案（Claude Pro、Google AI Plus） |
| AI4 | 用量用完 | 等重置，期間做審查、手動測試、寫 Issue；不開超額付費 |
