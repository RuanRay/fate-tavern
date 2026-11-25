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
    // AGENTS §4-1、B3：規則引擎的時間與亂數只能由 ctx 帶入
    files: ["packages/rules-engine/**"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "crypto", message: "用 ctx.rng（技術規劃 §12-5）" },
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message: "用 ctx.rng（技術規劃 §12-5）",
        },
        { object: "Date", property: "now", message: "用 ctx.now" },
      ],
      "no-restricted-imports": ["error", { paths: ["crypto", "node:crypto"] }],
    },
  },
  { files: ["**/*.js"], extends: [tseslint.configs.disableTypeChecked] },
);
