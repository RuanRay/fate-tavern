# AGENTS.md｜命運酒館（Fate Tavern）AI 開發規範

> 這是所有 AI 工具共用的**唯一規範來源**（2026-11-25：實作用 Claude Code、審查用 Gemini，見 `docs/prompts/AI工具與上下文.md`）。
> `CLAUDE.md`、`GEMINI.md` 只是匯入本檔；要改規範，只改這裡。
> 回覆與文件一律使用**繁體中文**；程式碼識別字、commit 訊息用英文。

---

## 1. 專案一句話

4 人約 2.5 小時的**沙發派對競技遊戲**：客廳大螢幕（Godot 主螢幕）顯示地圖與演出，每人用手機（網頁）操作；塔羅、星座、骰子、喝酒（酒精版）為核心；伺服器權威結算所有規則。

## 2. 真相來源（Source of Truth）

遇到問題時依下列順序查，**不准自己發明規則或數值**：

| 優先 | 文件 | 內容 |
|---|---|---|
| 1 | `docs/design/命運酒館_規則優先序.md` | 規則衝突裁定、結算流程、傷害公式、反應鏈、死亡 |
| 2 | `docs/design/命運酒館_訊息格式.md`＋`docs/design/命運酒館_訊息欄位表.md` | 三端通訊合約（信封、命令、事件、可見性、演出、小遊戲）；每個訊息的欄位以欄位表為準 |
| 3 | `docs/design/命運酒館_設定總表.md` | 全部遊戲數值與系統規則 |
| 4 | `docs/design/命運酒館_MVP卡牌v4.md`（MVP 卡牌與寫法規則）、`命運酒館_塔羅小牌56張.md`、`命運酒館_塔羅大牌22張.md`、`命運酒館_試煉卡24張.md`、`命運酒館_小遊戲規格.md`、`命運酒館_平衡標準.md`、`命運酒館_機器人策略.md`、`命運酒館_美術與音效清單.md`、`命運酒館_文字內容與引導提示.md`、`命運酒館_灰盒測試計畫.md`、`命運酒館_合規與上架.md` | 卡牌內容；MVP 範圍以 v4 為準；小遊戲的計分與參數 |
| 4.5 | `docs/design/效果元件對照表.md` | 效果元件、狀態、觸發點；道具、骰子、技能、星座、聖物的元件對照；scripted handler 清單 |
| 4.6 | `docs/design/命運酒館_遊戲狀態模型.md` | 規則引擎 `GameState` 的唯一欄位定義、可見性、不變量；**不准自行增減欄位** |
| 4.7 | `docs/design/命運酒館_設定檔總表.md` | 所有系統數值的設定鍵、檔案與預設值；功能開關與第一階段暫代規則 |
| 4.8 | `docs/design/命運酒館_資料庫結構.md` | 全部資料表、欄位、索引、保存期限、migration 規則；**不准自行加表或欄位** |
| 5 | `docs/design/命運酒館_技術規劃.md` | 架構、技術選型、事件結算引擎、部署 |
| 6 | `docs/phases/Mx_*.md` | 目前階段的需求、技術細節、驗收條件 |
| 7 | `docs/constraints/*.md` | 技術限制、版本鎖定 |
| 8 | `docs/decisions/ADR-*.md` | 已定案的技術決策 |
| 9 | `docs/checklists/*.md` | 專案檢查表、Godot 專用檢查表、美術 × 玩法決策流程（流程與檢查，不是規則來源） |
| 10 | `docs/ui/命運酒館_畫面清單.md`、`docs/ui/命運酒館_文字版主螢幕.md`、`docs/ui/命運酒館_手機介面規範.md` | 主螢幕、手機、後台的畫面編號與內容；第一階段的文字版主螢幕（T 系列）；手機的設計代號、元件與樣式寫法（不准寫死顏色、字級、間距） |

- `docs/archive/` 只是歷史紀錄，內容已被上表的文件取代，**不能當作規則或數值的依據**；`export/` 是產生的文件包，不要讀也不要改。
- 文件之間有矛盾、或文件沒寫到：**停下來，列出矛盾點與選項，請人類決定**。不准挑一個自己覺得合理的直接實作。
- 遊戲設計（規則、數值、卡牌效果）由企劃決定；AI 只能**提問與提案**，不能自行定案。

## 3. 架構邊界（違反即退件）

```
Godot 主螢幕（GDScript）──┐
手機控制器（React）───────┼── WebSocket(JSON) ──▶ 伺服器（Node.js＋Fastify＋ws）──▶ 規則引擎（純 TS）
管理後台（React）─────────┘                                │
                                                          └──▶ PostgreSQL（事件＋快照＋審計）
```

| 規則 | 說明 |
|---|---|
| B1 | **所有規則只在 `packages/rules-engine` 結算**。Godot、手機、後台不判定合法性、不計算結果 |
| B2 | 客戶端只送 Command；收到 Event／Projection 才更新畫面 |
| B3 | `rules-engine` 是純函式：不碰網路、資料庫、檔案、時鐘、`Math.random()`；時間與亂數由輸入帶入 |
| B4 | 協定只在 `packages/protocol`（Zod）定義一次；JSON Schema、TS 型別、GDScript 類別一律由程式產生，**不准手寫第二份** |
| B5 | 事件寫入 PostgreSQL 成功後，才能回覆 `command.accepted` 與廣播 |
| B6 | 不公開的資料在伺服器端過濾，**不准送到不該看的裝置再由前端隱藏** |
| B7 | 卡牌效果寫在 `content/*.yaml`，只能組合受控效果元件（`docs/design/效果元件對照表.md`）；特殊效果只能呼叫有測試的 TS handler，**MVP 只允許 2 個**（命定天罰、祭司大招），新增要開 ADR；**禁止 `eval`、動態程式碼** |
| B8 | 依賴方向：`server → rules-engine → (無)`；`godot-client` 只讀 `protocol-codegen` 的產物，不匯入 TS |

## 4. 硬性禁止（Hard Constraints）

1. 禁止 `Math.random()`、`crypto.getRandomValues()`、`crypto.randomBytes()`、`Date.now()` 出現在 `rules-engine`；亂數只能透過 `ctx.rng(流名稱)` 取得（技術規劃 §12-5）。
2. 禁止只把房間權威狀態存在記憶體。
3. 禁止在 WebSocket handler 寫卡牌規則。
4. 禁止 `any`（TS）、未標型別的 GDScript 公開函式與網路 DTO。
5. 禁止關閉、跳過、刪除既有測試或 lint 規則來讓 CI 通過。
6. 禁止未經 ADR 新增執行期依賴套件（開發工具類在 PR 說明理由即可）。
7. 禁止修改 `docs/design/` 任何文件，除非任務明確要求。
8. 禁止把 Token、密碼、`.env` 寫進程式碼、日誌、測試快照或 commit。
9. 禁止 Godot 3 語法（`onready`、`yield`、`Tween` 當節點、舊 `WebSocketClient`）；只用 Godot 4 API。
10. 禁止為了「看起來完成」留下假實作；做不到的部分要明確寫進 PR 的「未完成」欄。
11. 禁止一次 PR 超過 **400 行**手寫變更（不含產生檔、YAML 內容、測試資料）；超過就拆。

## 5. 工作流程（每個任務都照做）

1. **讀**：本檔＋目前階段文件＋任務提到的設計文件段落。
2. **計畫**：先輸出計畫（要改哪些檔、為什麼、怎麼測），等人類確認後才寫程式。小於 50 行的修正可以直接做。
3. **測試先行**：規則、協定、資料庫的變更，先寫失敗的測試，再實作。
4. **實作**：一次只做一個需求 ID（例如 `M1-R03`）。
5. **自我檢查**：跑 `pnpm typecheck && pnpm lint && pnpm test`（Godot 變更另跑 GUT），全部通過才交付。
6. **交付**：照 `.github/pull_request_template.md` 填寫，含需求 ID、測試結果、未完成項目、需要人類決定的問題。
7. **審查**：由**另一個 AI 工具**依 `docs/review/` 審查，再由人類合併（見 `docs/review/審查流程.md`；分支、提交訊息、CI 見 `docs/review/CI與分支規則.md`）。

## 6. 程式風格

### TypeScript（server、rules-engine、protocol、mobile-web、admin-web、tools）

- `strict: true`、`noUncheckedIndexedAccess: true`、`exactOptionalPropertyTypes: true`。
- 外部輸入（WebSocket、HTTP、YAML、資料庫讀出）一律先 Zod parse，再轉成內部型別；禁止 `as` 強轉未驗證資料。
- 規則引擎：狀態不可變（回傳新物件）；Reducer 簽名 `(state, command, ctx) => { state, events }`，`ctx` 帶 `rng`、`now`。
- 錯誤用回傳的 Result／拒絕代碼表示規則錯誤；`throw` 只用在程式錯誤。
- 檔名 `kebab-case.ts`；型別 `PascalCase`；函式與變數 `camelCase`；常數 `UPPER_SNAKE_CASE`。

### GDScript（godot-client）

- 公開函式、成員變數、訊號參數全部標型別；網路資料一律用產生的 DTO 類別。
- Autoload 只放：`Net`（WebSocket）、`Store`（Projection）、`Clock`（時鐘校正）、`Presenter`（演出佇列）、`I18n`。
- 場景負責呈現；不在場景腳本裡解讀規則。
- Scene 自給自足（不用 `../..` 存取外部節點，依賴由父層注入）、Resource 不存執行中數值、`await` 之後重新檢查節點：完整清單見 `docs/checklists/02_Godot專用檢查表.md`。
- 檔名 `snake_case.gd`；類別 `PascalCase`（`class_name`）。

### 共通

- 函式超過 60 行、檔案超過 400 行就要拆。
- 註解寫「為什麼」，不寫「做什麼」；引用設計文件時寫章節，例如 `// 規則優先序 §6 傷害公式`。
- 顯示文字一律走語系鍵（`i18n/zh-TW.json`），不寫死在程式。

## 7. 專案結構

見 `docs/design/命運酒館_技術規劃.md` 第 10 節。新增頂層資料夾要先開 ADR。

## 8. 常用指令

```bash
pnpm install
docker compose -f infra/docker-compose.yml up -d   # PostgreSQL
pnpm dev                                            # server + mobile-web + admin-web
pnpm typecheck && pnpm lint && pnpm test            # 交付前必跑
pnpm protocol:gen                                   # 由 Zod 產生 JSON Schema、TS、GDScript
pnpm content:build                                  # YAML → JSON 並驗證
pnpm test:replay && pnpm test:recovery              # 黃金重播、崩潰恢復
```

（指令在 M0 建立；建立前以實際 `package.json` 為準。）

## 9. 遇到不確定時

用下列格式停下來提問，不要猜：

```
【需要決定】
問題：
相關文件與章節：
選項 A：…（影響：…）
選項 B：…（影響：…）
我的建議：…（理由）
```
