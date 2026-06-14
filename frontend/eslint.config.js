import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

const MAX_STATEMENTS = 150;

const baseRules = {
  "prettier/prettier": "error",
  "one-var": ["error", "never"],
  "no-warning-comments": "off",
  "sort-keys": "off",
  "sort-imports": "off",
  "max-params": ["warn", 6],
  "max-statements": ["error", MAX_STATEMENTS],
  "max-lines-per-function": ["error", MAX_STATEMENTS],
  "prefer-destructuring": ["error", { object: true, array: false }],
};

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      prettier: prettierPlugin,
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...baseRules,
    },
  },
  prettierConfig,
]);
