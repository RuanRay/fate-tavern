import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["**/dist/", "**/coverage/", "export/"] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: { parserOptions: { projectService: true } },
    rules: {
      // AGENTS §4-4；strictTypeChecked 已含，寫明避免日後換規則組時漏掉
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    // AGENTS §4-1、B3：規則引擎不碰時鐘、亂數、I/O；時間與亂數只能由 ctx 帶入
    files: ["packages/rules-engine/**"],
    rules: {
      "no-restricted-globals": [
        "error",
        ...[
          "crypto",
          "performance",
          "process",
          "fetch",
          "setTimeout",
          "setInterval",
        ].map((name) => ({ name, message: "規則引擎是純函式（AGENTS B3）" })),
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message: "用 ctx.rng（技術規劃 §12-5）",
        },
        { object: "Date", property: "now", message: "用 ctx.now" },
        { object: "globalThis", message: "規則引擎是純函式（AGENTS B3）" },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: "用 ctx.now",
        },
        {
          selector: "CallExpression[callee.name='Date']",
          message: "用 ctx.now",
        },
      ],
      // 不准匯入任何 Node 內建模組（檔案、網路、時鐘、亂數）
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex:
                "^(node:|(fs|path|os|net|http|https|crypto|perf_hooks|child_process|worker_threads|timers)(/|$))",
              message: "規則引擎是純函式（AGENTS B3）",
            },
          ],
        },
      ],
    },
  },
  { files: ["**/*.js"], extends: [tseslint.configs.disableTypeChecked] },
);
