#!/usr/bin/env bash
# 產生給 claude.ai 專案、分享、其他 AI 交叉檢查用的文件包（原本 repo 裡的「專案文件/」）。
# 為什麼用產生的：手動維護兩份一樣的文件一定會漂移；repo 的 docs/ 才是唯一來源。
# 用法：bash tools/export-docs/export.sh [輸出資料夾，預設 export/專案文件]
set -euo pipefail
cd "$(dirname "$0")/../.."
out="${1:-export/專案文件}"
rm -rf "$out" && mkdir -p "$out"

# 1. 設計與畫面文件：一律加上「命運酒館_」前綴
for f in docs/design/*.md docs/ui/*.md docs/archive/*.md; do
  b=$(basename "$f")
  case "$b" in 命運酒館_*) cp "$f" "$out/$b" ;; *) cp "$f" "$out/命運酒館_$b" ;; esac
done

# 2. 彙整版：依固定順序合併，每段標註來源
trim() { sed -e :a -e '/^\n*$/{$d;N;ba' -e '}' "$1"; }
bundle() { # 檔名 標題 說明 來源...
  local file="$out/$1" title="$2" note="$3"; shift 3
  printf '# %s\n> %s；repo 中以拆開的檔案為準。匯出日期：%s。\n\n---\n\n' "$title" "$note" "$(date +%F)" > "$file"
  local first=1
  for p in "$@"; do
    [ $first = 1 ] || printf '\n---\n\n' >> "$file"; first=0
    printf '<!-- 來源：%s -->\n\n' "$p" >> "$file"
    trim "$p" >> "$file"
  done
}
bundle 命運酒館_AI規範審查與限制.md "命運酒館｜AI 開發規範、審查與限制（彙整版）" \
  "由 \`AGENTS.md\`、\`docs/review/\`、\`docs/constraints/\`、\`docs/prompts/\`、\`docs/decisions/\` 合併而成" \
  AGENTS.md docs/review/審查流程.md docs/review/審查清單.md docs/review/審查提示詞.md docs/review/CI與分支規則.md \
  docs/constraints/技術限制.md docs/constraints/版本鎖定.md docs/prompts/提示詞範本.md docs/prompts/AI工具與上下文.md \
  docs/decisions/ADR-0001_初始技術決策.md
bundle 命運酒館_開發階段需求.md "命運酒館｜開發階段需求 M0～M8（彙整版）" "由 \`docs/phases/\` 合併而成" \
  docs/phases/00_階段總覽.md docs/phases/M0_骨架與合約.md docs/phases/M1_權威地基.md docs/phases/M2_規則核心.md \
  docs/phases/M3_效果系統.md docs/phases/M4_卡牌內容.md docs/phases/M5_小遊戲.md docs/phases/M6_經濟系統.md \
  docs/phases/M7_職業與勝負.md docs/phases/M8_房主工具與灰盒版.md docs/phases/工作清單_第一階段.md
bundle 命運酒館_開發檢查表與決策流程.md "命運酒館｜開發檢查表與美術 × 玩法決策流程（彙整版）" \
  "由 \`docs/checklists/\` 合併而成（改寫自使用者提供的獨立遊戲檢查表）" \
  docs/checklists/01_專案檢查表.md docs/checklists/02_Godot專用檢查表.md docs/checklists/03_美術與玩法決策流程.md

echo "已產生 $(ls "$out" | wc -l) 份文件到 $out"
