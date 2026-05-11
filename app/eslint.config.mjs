import js from "@eslint/js";
import importAlias from "@dword-design/eslint-plugin-import-alias";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import solid from "eslint-plugin-solid";
import unusedImports from "eslint-plugin-unused-imports";

const solidTypeScriptRules = solid.configs["flat/typescript"].rules;

export default [
  {
    ignores: [
      "dist/**",
      ".output/**",
      ".vinxi/**",
      "styled-system/**",
      "app.config.timestamp_*.js",
      "node_modules/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@dword-design/import-alias": importAlias,
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
      solid,
      "unused-imports": unusedImports,
    },
    settings: {
      "import/internal-regex": "^~/",
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...solidTypeScriptRules,
      "no-redeclare": "off",
      "no-undef": "off",
      "no-empty": "off",
      "no-useless-escape": "off",
      "prefer-const": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "import/no-extraneous-dependencies": "warn",
      "@dword-design/import-alias/prefer-alias": [
        "warn",
        {
          alias: {
            "~": "./src/",
          },
        },
      ],
      "solid/no-innerhtml": "off",
      "solid/prefer-for": "warn",
    },
  },
];
