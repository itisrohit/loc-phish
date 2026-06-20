import js from "@eslint/js";
import globals from "globals";

export default [
  // Files to ignore
  {
    ignores: [
      "dist/**",
      "node_modules/**"
    ]
  },
  // Javascript settings
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-console": "off",
      "no-debugger": "warn",
      "semi": ["error", "always"],
      "quotes": ["error", "double", { "avoidEscape": true }]
    }
  }
];
