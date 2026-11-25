# 02｜Godot 專用檢查表（命運酒館版）

> 來源：使用者提供的「Godot 專用問題與檢查表」（2026-11-24），依本專案改寫。
> 本專案的 Godot **只做呈現**（AGENTS §3 B1）：不判定規則、不做物理碰撞判定、不存檔。所以原表的 Hitbox／Hurtbox、Collision Layer、角色物理移動、存檔等項目不適用；保留的是 Scene 結構、Autoload、Signal、Resource、生命週期、await、UI、型別、效能這些和呈現層直接相關的部分。
> 審查時對應 `docs/review/審查清單.md` 的 GD 區；本檔是 GD 區的展開版。

---

## 1. Scene 自給自足、依賴由上層注入

- [ ] 可重用 Scene（格子、玩家棋子、玩家面板、卡牌、骰子）不使用 `../..` 存取外部節點
- [ ] 外部依賴由父層呼叫 `initialize(...)` 注入；子 Scene 用 Signal 回報事件
- [ ] 每個 Scene 可以單獨按 F6 執行（用假資料）
- [ ] 不以 `get_parent().get_parent()`、`find_child()` 作為主要架構
- [ ] 不在 `_process()` 中反覆 `get_node()`

## 2. NodePath

- [ ] 跨 Scene 依賴用 `@export` 型別欄位在 Inspector 指定，不寫深層路徑
- [ ] 重要節點引用有型別（例如 `@onready var panel: PlayerPanel = $Panel`）
- [ ] 不用節點名稱判斷遊戲邏輯（反正 Godot 也不該有遊戲邏輯）

## 3. Autoload

本專案固定 5 個（AGENTS §6）：`Net`、`Store`、`Clock`、`Presenter`、`I18n`。

- [ ] 沒有第 6 個 Autoload（新增要開 ADR）
- [ ] 沒有全能型 GameManager；Autoload 不持有某個場景節點的永久引用
- [ ] 回到大廳、重新開房時，`Store`、`Presenter` 會完整重設
- [ ] `Store` 只存伺服器給的投影（Projection），不存自己算出來的遊戲數值

## 4. Signal

- [ ] Signal 名稱用過去式（`dice_landed`、`presentation_finished`）、參數有型別
- [ ] 父控制子用直接呼叫；子通知父用 Signal；跨整個遊戲的事件才走 Autoload
- [ ] 重新進入場景不會重複連接（必要時 `is_connected()`）
- [ ] 沒有 A 通知 B、B 又立刻通知 A 的循環

## 5. Resource 共用

- [ ] Resource 只保存靜態呈現設定（格子外觀、職業立繪、卡面、演出時長）
- [ ] 執行中的數值（某玩家的生命、金幣）**不寫進** Resource；它們只存在 `Store`
- [ ] 若真的需要每個實例獨立的 Resource，用 `duplicate(true)`，並確認巢狀 Resource
- [ ] 遊戲執行中不會改寫任何 `.tres`

## 6. 不是所有東西都要做成 Node

- [ ] 純資料轉換（DTO → 顯示用資料、格子座標計算）用 `RefCounted` 或靜態函式
- [ ] 這些轉換可以在 GUT 中不載入 Scene 直接測試

## 7. `_process()`、Tween 與演出

（本專案沒有物理角色移動；棋子移動、翻牌、數值變化都是演出。）

- [ ] 演出用 Tween、AnimationPlayer，或 `_process(delta)` 乘以 delta，不用固定位移
- [ ] 同一個 Transform 不會同時被兩個 Tween 或 `_process` 修改
- [ ] 演出速度設定（1x／1.5x／2x）只改播放速度，不改伺服器結果
- [ ] 已在 30、60、144 FPS 下測試演出時長與完成回報一致

## 8. `queue_free()` 與已刪除物件

- [ ] `queue_free()` 之後不再對該節點執行流程
- [ ] 延遲回呼、Timer timeout 前用 `is_instance_valid()` 確認
- [ ] 同一個演出的「完成回報」只送一次

## 9. `await` 之後環境可能已經變了

- [ ] 每個 `await` 之後重新確認節點與 `Store` 狀態仍然有效
- [ ] 收到新快照（重連、回滾）時，正在播放的演出能被取消並清理
- [ ] 連點按鈕不會啟動多份相同流程
- [ ] 演出被中斷時，畫面會回到「以目前投影為準」的狀態，不會卡在半途

## 10. `@tool` 與編輯器工具（只有寫編輯器工具時適用）

- [ ] 用 `Engine.is_editor_hint()` 區分編輯器與遊戲
- [ ] 產生節點時設定正確 `owner`；支援 Undo／Redo
- [ ] 不在 Setter 或 `_process()` 中重建整棵樹

## 11. PackedScene 載入

- [ ] 高頻生成物（金幣粒子、傷害數字、骰子）的 PackedScene 用 `preload()` 或快取
- [ ] 大型場景（酒館桌面、神殿特寫）用背景載入，載入中畫面持續更新
- [ ] 不在 `_process()` 中載入資源

## 12. UI（Control、Container、Anchor）

主螢幕是**電視、距離約 3 公尺**；手機 UI 在 React，不在 Godot。

- [ ] HUD（四角玩家面板）放在 CanvasLayer，不跟著地圖鏡頭縮放
- [ ] 放進 Container 的 Control 不依賴手動 Position
- [ ] 純裝飾 Control 的 Mouse Filter 設為 Ignore
- [ ] 720p、1080p、4K 電視輸出都測過；16:9 為主，21:9 不裁切關鍵資訊
- [ ] 字型、Theme 集中設定，不散在各節點
- [ ] 主螢幕文字在 3 公尺外可讀（最小字級 ⚠️ 依美術規範定）

## 13. AnimationPlayer 不是規則來源

- [ ] 動畫只負責「看起來」；何時扣血、扣多少一律來自伺服器事件
- [ ] 動畫名稱集中管理；動畫被中斷時一定會送出完成回報或被 Presenter 收尾
- [ ] 3D 骰子停下的點數等於伺服器結果（技術規劃 §3）

## 14. `class_name` 與靜態型別

- [ ] `class_name` 只給真正可重用的類型（`PlayerPanel`、`CardView`、`DiceView`、產生的 DTO）
- [ ] 公開函式、成員、Signal 參數全部有型別；網路資料一律用 `protocol-codegen` 產生的類別
- [ ] GDScript Warning 規則全隊統一，不大量忽略

## 15. Scene 繼承

- [ ] Inherited Scene 不超過兩層；差異優先用元件組合或 Resource 參數

## 16. 效能（Profiler）

- [ ] 用 Debugger → Profiler 量最重的演出：4 人同時數值變化＋卡牌翻出＋粒子
- [ ] 看 Frame Time，不只看平均 FPS；記錄偶發卡頓（第一次載入 Shader）
- [ ] 用 Monitors／ObjectDB 確認：連玩 10 局後節點數回到合理範圍（沒有演出節點洩漏）
- [ ] 在你的筆電實測（2026-11-25 不做低規格測試；灰盒遇到受測者自備電腦時，記錄規格與幀率）

## 17. 本專案專屬

- [ ] 只有 Godot 4 語法（AGENTS §4 第 9 條）
- [ ] 所有 WebSocket 訊息帶 `protocolVersion`；版本不符時顯示拒絕畫面
- [ ] Godot 不計算任何遊戲數值（例如不自己算起點收入、不自己判定勝負）
- [ ] 地圖格子位置由「格子順序＋外形」計算，不手擺
- [ ] 斷線重連後先套用快照，再播之後的事件

## 發布前最重要的 10 項

1. 固定 Godot 版本，發布前不升級
2. 可重用 Scene 不依賴外部 NodePath
3. Autoload 只有 5 個
4. Resource 不存執行中數值
5. `await` 之後重新檢查節點
6. `queue_free()` 之後不再操作
7. 演出可被新快照中斷並正確收尾
8. 主螢幕在 3 公尺外可讀
9. 用 Profiler 量過最重的演出
10. 匯出的正式版在乾淨的 Windows 上完整玩過一局
