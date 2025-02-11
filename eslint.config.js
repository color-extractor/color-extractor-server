const js = require("@eslint/js");

const eslintConfigPrettier = require("eslint-config-prettier");

const globals = require("globals");

module.exports = [
  { ignores: ["dist"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: {},
    plugins: {},
    rules: {
      ...js.configs.recommended.rules,
    },
  },
  eslintConfigPrettier,
];
