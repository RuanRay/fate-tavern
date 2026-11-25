# 命運酒館｜CI 與分支規則 v1.1

> 更新日期：2026-11-25（v1.1：🔴 的兩份審查改成兩個不同重點的 Gemini 對話；v1.0：定案，確認紀錄見第 7 節）
> 用途：GitHub Actions 每個流程跑什麼、多久要跑完；你一個人開發時的分支、提交、合併規則。AI 建立 `.github/workflows/` 時照本文件。
> 依據：《審查流程》§3、§4、《審查清單》、《技術限制》、《工作清單》§1、各階段驗收條件。

---

## 1. 分支與合併

| 項目 | 規則 |
|---|---|
| 模式 | 主幹開發：只有 `main` 一條長期分支；每個任務一條短分支，做完就合併刪掉 |
| 分支名稱 | `t/T-M0-07-protocol-envelope`（任務 ID＋簡短英文） |
| 一個任務 | 一條分支、一個 PR；同時最多 2 個進行中（工作清單 §1） |
| 合併方式 | 只允許 **Squash merge**；合併後自動刪分支 |
| 直接推 `main` | 禁止。GitHub Free 的私有 repo 沒有分支保護（Q5），**這條靠自律**；`main.yml` 會偵測沒經過 PR 的推送並開 Issue（第 1-2 節） |
| `main` 壞掉 | 先 revert 造成問題的 PR，再開新分支修；不在 `main` 上直接修 |
| 提交訊息 | 英文、Conventional Commits：`feat(rules-engine): add damage pipeline [T-M3-07]`；PR 標題同格式，squash 後成為 `main` 上的那一筆 |
| PR 內文 | 照 `.github/pull_request_template.md`：任務 ID、需求 ID、`Closes #<Issue>`、實作工具、審查工具、測試結果、未完成、需要決定的事、人類最後檢查勾選 |

### 1-1 一個人時怎麼「核准」（Q1）

GitHub 不能讓 PR 作者核准自己的 PR；而且 GitHub Free 的私有 repo 沒有分支保護，CI 擋不住合併。所以改用一個 CI 檢查 `review-gate` 亮燈，**你只在 `review-gate` 和 `pr.yml` 全綠時才按合併**：

| `review-gate` 檢查 | 條件 |
|---|---|
| 審查報告 | PR 留言中有 `## 審查報告`，且「審查工具」和 PR 內文的「實作工具」不同（實作 Claude、審查 Gemini） |
| 🔴 變更 | 改到 🔴 路徑（審查流程 §3：`rules-engine`、`protocol`、`database`、事件儲存、權限與 Token、覆寫、可見性過濾）時，要有**兩份**審查報告：「審查重點」一份是「一般」、一份是「規則與安全」（都是 Gemini，不同對話；AI 工具與上下文 §2-1） |
| 意見處理 | 審查報告的每條 🔴 意見都有回覆標記（已修正／不同意＋理由／開新 Issue） |
| 人類最後檢查 | PR 內文「人類最後檢查」5 項全部打勾（審查流程 §6） |
| 🔴 冷卻 | 🔴 PR 從最後一次推送到合併至少隔 **12 小時**（「隔天再看一次 diff」） |

- `review-gate` 在 PR 留言或內文變動時重跑（`issue_comment`、`pull_request` 的 `edited` 事件）。
- 路徑對應的風險等級寫在 `.github/risk-paths.yml`，`review-gate` 與 Issue 範本共用。
- `CODEOWNERS` 在 Free 方案的私有 repo 不會生效，保留只當「哪些路徑是 🔴」的說明。

### 1-2 事後稽核（補上沒有分支保護的缺口）

| 檢查 | 做法 |
|---|---|
| 合併時 `review-gate` 或 `pr.yml` 不是綠燈 | `main.yml` 在每次合併後查這個 PR 的檢查結果；不是全綠就自動開 Issue（標籤 `gate-bypass`），附 PR 連結 |
| 沒經過 PR 直接推到 `main` | `main.yml` 檢查這筆提交有沒有對應的 PR；沒有就開 Issue（標籤 `gate-bypass`） |
| 處理 | `gate-bypass` Issue 要在下一個任務開始前補上審查（補跑審查 AI、補報告），或 revert |
| 每週 | 每週檢查一次看板，`gate-bypass` 必須是 0 |

## 2. 流程一覽

| 流程 | 觸發 | 時間上限 | 內容 |
|---|---|---|---|
| `pr.yml` | 每個 PR 推送 | **10 分鐘** | 第 3 節 |
| `review-gate.yml` | PR 內文、留言變動 | 1 分鐘 | 第 1-1 節 |
| `main.yml` | 合併到 `main` | 15 分鐘 | `pr.yml` 全部＋覆蓋率報告＋建置產物＋事後稽核（第 1-2 節） |
| `nightly.yml` | 每天凌晨（台灣時間 03:00），**只在 `main` 前一天有新合併時才跑**（Q2） | 60 分鐘 | 第 4 節 |
| `release.yml` | 推 `v*` 標籤 | 20 分鐘 | 第 5 節 |

## 3. `pr.yml`（每個 PR）

| # | 檢查 | 失敗代表 | 開始於 |
|---|---|---|---|
| P1 | `pnpm install --frozen-lockfile`（快取 pnpm store） | lockfile 沒更新 | M0 |
| P2 | `pnpm typecheck` | 型別錯誤 | M0 |
| P3 | `pnpm lint`：ESLint＋Prettier＋自訂規則（`rules-engine` 禁用時間、亂數、I/O；手機禁止寫死色碼與 px 字級；禁止 `any`） | 違反 AGENTS §4 | M0 |
| P4 | `pnpm protocol:gen && git diff --exit-code` | 產生檔被手改或沒重新產生 | M0 |
| P5 | `pnpm content:build`：YAML 與 `content/config/*.yaml` 通過 Zod、算 `configHash` | 內容或設定錯誤 | M0 |
| P6 | 單元測試（Vitest） | — | M0 |
| P7 | 協定契約測試（範例 valid／invalid） | 協定漂移 | M0 |
| P8 | 整合測試（GitHub Actions 的 PostgreSQL 服務容器） | 資料庫或管線錯誤 | M0 |
| P9 | 黃金重播（精簡：每個里程碑 3 組） | 確定性被破壞 | M1 |
| P10 | 崩潰恢復（精簡：3 個中斷點） | 恢復失敗 | M1 |
| P11 | 性質測試（fast-check 每個性質 200 次） | 不變量被破壞 | M1 |
| P12 | Playwright 煙霧測試：開房＋4 分頁加入（Chromium＋WebKit 手機模擬） | 加入流程壞掉 | M0 |
| P13 | 手機首次載入 JS 大小 < 500 KB（壓縮後） | 太大 | M0 |
| P14 | 語系缺鍵 | 文字沒進語系檔 | M0 |
| P15 | 對比度檢查（暗色、淺色設計代號） | 看不清楚 | M0 |
| P16 | PR 大小：手寫變更 ≤ 400 行（排除產生檔、`content/`、測試資料、`*.snap`） | 要拆 PR | M0 |
| P17 | 覆蓋率門檻：`rules-engine` 行 90%、分支 85%；`protocol`、`server` 行 80%；手機、主螢幕、後台不設（Q4） | 測試不足 | M1 |
| P18 | 機器人 50 局（隨機合法機器人，固定種子） | 卡死或例外 | M2 |

- 只跑受影響的套件時用 `pnpm --filter ...[origin/main]`；但 P4、P5、P7、P9 一律全跑。
- 超過 10 分鐘時：先把慢的檢查移到 `nightly.yml`，不是放寬時間上限。

## 4. `nightly.yml`（每晚）

| 檢查 | 內容 | 開始於 |
|---|---|---|
| N1 | 完整黃金重播（全部劇本） | M1 |
| N2 | 完整崩潰恢復（20 個中斷點） | M1 |
| N3 | 性質測試（每個性質 5,000 次） | M1 |
| N4 | 機器人 1,000 局（M2-A01、M4-A06…）；第二階段起含模擬報告 | M2 |
| N5 | Playwright 完整流程（第一階段可玩範圍） | M2 |
| N6 | `pnpm audit`（高風險以上就失敗） | M0 |
| N7 | 設定與內容一致性：設定檔總表的鍵與 `content/config` 一致 | M0 |

- 失敗時自動開一個 Issue（標籤 `nightly-fail`），附失敗的種子與中斷點，方便重現。

## 5. `release.yml`（推標籤）

| 項目 | 內容 |
|---|---|
| 標籤 | 每個里程碑完成時推 `v0.<里程碑>.0`（例：M1 完成＝`v0.1.0`）；試玩前推 `v0.<里程碑>.<n>` |
| 產物 | 伺服器 Docker 映像（固定版本、非 root）、手機網頁、文字版主螢幕、後台的靜態檔；第二階段起加 Godot Windows 匯出 |
| 紀錄 | 自動產生 Release Notes（依 PR 標題）；附當時的 `contentVersion`、`configHash` |

## 6. 其他規則

| 項目 | 規則 |
|---|---|
| GitHub Actions 版本 | 第三方 Action 一律固定 commit SHA（審查清單 X-03） |
| 祕密 | 放 GitHub Environments（`staging`、`production`）；`pr.yml` 拿不到任何祕密 |
| 依賴更新 | 只開 Dependabot **安全性更新**；一般版本升級照版本鎖定規則（ADR、獨立分支）（Q3） |
| 本機 | 提交前自動跑 `lint-staged`（只檢查改到的檔案）；不強制，CI 才是最後關卡 |
| GitHub 方案 | **GitHub Free**（Q5）。私有 repo 沒有分支保護、必要審查人、CODEOWNERS（屬於 Pro／Team），所以合併規則靠自律＋事後稽核（第 1-2 節）。之後想強制時可以升級 Pro，不用改流程 |
| Actions 用量 | GitHub Free 私有 repo 每月 2,000 分鐘。估算：每週約 10 次 PR 推送 × 10 分鐘（約 430 分鐘／月）＋合併後的 `main.yml`（約 200 分鐘）＋每晚只在有合併時跑（每週 4～5 晚 × 30～60 分鐘，約 500～1,100 分鐘）≈ 每月 1,100～1,700 分鐘。M2 以後機器人 1,000 局加入每晚檢查時再量一次；接近 1,800 分鐘就把每晚檢查改成每週兩次 |

## 7. 確認紀錄（2026-11-25）

| # | 問題 | 決定 |
|---|---|---|
| Q1 | 一個人怎麼「核准」 | `review-gate` 檢查審查報告、🔴 兩份不同工具、意見處理、人類最後檢查勾選、🔴 冷卻 12 小時；全綠才合併 |
| Q2 | 每晚檢查 | 只在 `main` 前一天有新合併時才跑 |
| Q3 | 依賴更新 | 只開 Dependabot 安全性更新 |
| Q4 | 覆蓋率門檻 | `rules-engine` 行 90%／分支 85%；`protocol`、`server` 行 80%；前端不設 |
| Q5 | GitHub 方案 | **維持 Free，靠自律**；以事後稽核（`gate-bypass` Issue）補上沒有分支保護的缺口 |
