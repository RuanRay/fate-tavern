# 命運酒館｜vibe coding 開發包

> 本 repo（`fate-tavern`）的根目錄就是開發包。**`docs/` 是所有文件的唯一來源**（2026-11-25 起；當天已修正文件之間的矛盾）。claude.ai 專案、分享、其他 AI 交叉檢查要用的文件包，一律用 `bash tools/export-docs/export.sh` 從 `docs/` 產生（輸出到 `export/專案文件/`，不進 repo），不要手動維護第二份。

## 內容

```
AGENTS.md                         所有 AI 工具共用的規範（唯一來源）
CLAUDE.md                         Claude Code：匯入 AGENTS.md＋補充
GEMINI.md                         Gemini CLI：匯入 AGENTS.md＋補充
.github/
├─ pull_request_template.md       PR 模板
├─ CODEOWNERS                     高風險路徑需要 A 角色核准
└─ ISSUE_TEMPLATE/task.md         任務 Issue 模板
docs/
├─ design/                        設計文件（規則、數值、卡牌、技術規劃、訊息格式、效果元件對照表）
├─ checklists/                    專案檢查表、Godot 專用檢查表、美術 × 玩法決策流程
├─ ui/                            畫面清單
├─ phases/                        階段需求：00 總覽＋M0～M8＋第一階段工作清單
├─ review/                        審查流程、審查清單、審查提示詞、CI 與分支規則
├─ constraints/                   技術限制、版本鎖定
├─ prompts/                       實作用提示詞範本、交接範本、AI 工具與上下文
├─ decisions/                     ADR 範本與初始技術決策
└─ archive/                       歷史紀錄（已被取代，不是真相來源）：第三方檢核彙整 v1
tools/
└─ export-docs/export.sh          產生 27 份文件包（設計、畫面、歸檔各一份＋3 份彙整版）到 export/專案文件/
```

## 怎麼用

1. **開工前**：`docs/constraints/版本鎖定.md` 的版本號與 `CODEOWNERS`（@RuanRay）已於 2026-11-25 填好（Free 方案不會強制 CODEOWNERS，只當 🔴 路徑說明；🔴 由你核准＋兩個不同 AI 審查，見 `docs/review/審查流程.md` §3）；照 `docs/review/CI與分支規則.md` 設定（GitHub Free：不設分支保護，靠 `review-gate`＋事後稽核；只允許 Squash merge、合併後刪分支）。
2. **每個任務**：從階段文件挑一個需求 ID → 開 Issue → 用 `docs/prompts/提示詞範本.md` 第 1 節的提示詞交給實作 AI。
3. **審查**：用另一個 AI 工具＋`docs/review/審查提示詞.md`；依 `審查流程.md` 的風險等級決定要幾個審查。
4. **閘門**：M1（G1）、M3（G2）、M7（G3）、M8（G4）結束時，依 `00_階段總覽.md` 第 5 節簽核。
5. **每週**：用 `docs/checklists/01_專案檢查表.md` 第 9 節的模板做工程檢查；美術與玩法有衝突時走 `03_美術與玩法決策流程.md`。

## 本機啟動（M0-R03）

需要 Node.js 26（`.nvmrc`）、pnpm（Corepack）、Docker Desktop（版本見 `docs/constraints/版本鎖定.md`）。

```bash
pnpm install
docker compose -f infra/docker-compose.yml up -d --wait   # PostgreSQL 18.7，只開 127.0.0.1:5432
cp .env.example .env.local                                # 本機設定；.env.local 不進 repo
pnpm dev
```

- 資料存在 Docker volume `fate-tavern_pgdata`；`docker compose -f infra/docker-compose.yml down` 保留資料，加 `-v` 才會清空。
- 資料庫帳密有本機預設值（見 compose 檔），要改就在 shell 設 `POSTGRES_USER`／`POSTGRES_PASSWORD`／`POSTGRES_DB`／`POSTGRES_PORT`，並同步改 `.env.local` 的 `DATABASE_URL`。

## 套件慣例（M0-R02）

- 每個 TS 套件的 `tsconfig.json` 都 `extends` 根目錄的 `tsconfig.base.json`（strict 系列全開）；`typecheck` 指令寫 `tsc --noEmit -p .`。
- 套件要用 Node 型別時，自己裝 `@types/node` 並在 `compilerOptions.types` 加 `"node"`。
- **共用套件直接讀原始碼**：`package.json` 寫 `"exports": { ".": "./src/index.ts" }`，不需要先 build；TS、Vite、Node 26（type stripping）都能直接解析，`pnpm dev` 的平行啟動也不用管建置順序。因此原始碼不能用 `enum`、`namespace`（`erasableSyntaxOnly`）。
- 相對匯入一律寫 `.ts` 副檔名（`import { x } from "./foo.ts"`）：Node 26 不會把 `./foo.js` 對應回 `.ts`（`allowImportingTsExtensions`）。
- React 套件（`mobile-web`、`host-web`、`admin-web`）在自己的 `tsconfig.json` 補 `"jsx": "react-jsx"`，需要時把 `moduleResolution` 覆寫成 `bundler`。
- `pnpm lint` 在根目錄一次跑 ESLint＋`prettier --check`；`pnpm format` 自動排版。`docs/`、`*.md` 不經 Prettier。

## 三個 AI 工具怎麼讀規範

| 工具 | 讀取方式 |
|---|---|
| Claude Code | 自動讀 `CLAUDE.md`（內含 `@AGENTS.md` 匯入） |
| Gemini CLI | 自動讀 `GEMINI.md`（內含 `@./AGENTS.md` 匯入） |
| （2026-11-25）| 實作只用 Claude Code、審查只用 Gemini 網頁版（Google AI Plus）；見 `docs/prompts/AI工具與上下文.md`。ChatGPT／Codex 不在目前工具內。原說明：有 repo 存取的 Codex 會讀 `AGENTS.md`；網頁版對話照 `docs/prompts/提示詞範本.md` 第 6 節手動貼上 |

## 開工前仍需企劃決定的事

不卡住開工、但要在對應里程碑前決定的事（標 ⚠️ 的位置）：

- 美術實際工時：風格切片（約 2027-05 完成）後由小黃回填，再重排美術時程（`docs/design/命運酒館_美術與音效清單.md` §6-1）。
- 發行日期（`docs/checklists/01_專案檢查表.md`）。

**團隊與時程（2026-11-25）**：2 人——你寫全部程式（兼職每週約 20 小時，含 Godot 連線與演出框架）、小黃做全部美術、3D、骨架動畫與 Godot 場景。分三階段：**核心可玩版**（文字版主螢幕，約 2028-10）→ 完整內容（約 2029-07，G3）→ 灰盒版（約 2029-11，G4）。簡化後端：不做回滾、審計查詢、對局驗證檔。各階段文件開頭有「階段調整」說明，見 `docs/phases/00_階段總覽.md` §8 與技術規劃 §12-1。

**命名（2026-11-25）**：GitHub repo `fate-tavern`、套件前綴 `@fate-tavern/`（技術規劃 §10）。

資料庫結構 v1.0（2026-11-25）：`docs/design/命運酒館_資料庫結構.md`；全部資料表、保存期限與 migration 規則。

AI 工具與上下文 v1.0（2026-11-25）：`docs/prompts/AI工具與上下文.md`；Claude Pro 實作＋Google AI Plus 審查，每月約 NT$910；程式碼只送付費方案。

CI 與分支規則 v1.1（2026-11-25）：`docs/review/CI與分支規則.md`；PR、合併、每晚檢查與事後稽核。

手機介面規範 v1.0（2026-11-25）：`docs/ui/命運酒館_手機介面規範.md`；第一階段手機的設計代號與元件（暗色＋淺色）。

工作清單（第一階段）v1.0（2026-11-25）：`docs/phases/工作清單_第一階段.md`；每週照「下一個沒被擋住的任務」往下做，Issue 由 `tools/backlog` 產生。

訊息欄位表 v1.0（2026-11-25）：`docs/design/命運酒館_訊息欄位表.md`；第一階段每個訊息的欄位。

設定檔總表 v1.0（2026-11-25）：`docs/design/命運酒館_設定檔總表.md`；所有數值的設定鍵與功能開關。

遊戲狀態模型 v1.0（2026-11-25）：`docs/design/命運酒館_遊戲狀態模型.md`；規則引擎 `GameState` 的唯一欄位定義。

文字版主螢幕 v1.0（2026-11-25）：`docs/ui/命運酒館_文字版主螢幕.md`；第一階段的正式主螢幕 `apps/host-web`。

合規與上架 v1.0（2026-11-25）：`docs/design/命運酒館_合規與上架.md`（非法律意見，公開前請律師確認）。

灰盒測試計畫 v1.0（2026-11-25）：`docs/design/命運酒館_灰盒測試計畫.md`；G4 判定約 2029-11 初（2026-11-25 三階段重排）。

文字內容與引導提示 v1.0（2026-11-25）：`docs/design/命運酒館_文字內容與引導提示.md`。

美術與音效清單 v1.0（2026-11-25）：`docs/design/命運酒館_美術與音效清單.md`。

機器人策略 v1.0（2026-11-25）：`docs/design/命運酒館_機器人策略.md`。

平衡標準 v1.0（2026-11-25）：`docs/design/命運酒館_平衡標準.md`，閘門 G3、G4 依它判定。

小遊戲規格 v1.0（2026-11-25）：`docs/design/命運酒館_小遊戲規格.md`；MVP 只做卡牌用得到的對戰形式、平手加賽一回合。

開發環境（2026-11-25）：local／ci／staging／production 四個環境、區網 HTTPS（mkcert，備用 Cloudflare Tunnel）、Godot 只正式支援 Windows；測試硬體只有你的筆電與 iPhone 13（不做低規格測試，Android 灰盒時借手機）；機型與負責人在 M0 填入 `docs/constraints/版本鎖定.md`（見技術規劃 §7-1）。

已於 2026-11-25 決定：有限牌庫＋手機盲選、搖手機擲骰（只影響動畫）、大牌咪牌、高風險擲骰的近失演出、獨立亂數流、種子承諾、不使用動態權重（見設定總表 §5「牌庫與抽牌」、技術規劃 §12-5）。另確認：祭司大招在大牌牌庫空時不能發動、不消耗次數。（對局驗證檔原本確認在結算畫面與後台各一個入口，同日因簡化後端改為 MVP 不做；種子承諾保留。）

已於 2026-11-24 決定：主螢幕斷線自動暫停、風格切片（紙本試玩 2026-11-25 取消）、反應窗 5 秒且全員回應即關閉、進度落後的刪除順序、演出時長預算（見技術規劃 §0、§12-1～12-4）。

實作中發現新的模糊處，依 `AGENTS.md` §9 的【需要決定】格式提出。

仍待灰盒或模擬驗證的數值（不影響開工）：二對一平衡係數、反作弊門檻、高低連猜的期望值、手機首次載入大小上限、祭壇 18 個技能的升級數值、v4 冥界事件與死亡玩家道具之後的復活率、MVP 小牌 v4 的期望值。
