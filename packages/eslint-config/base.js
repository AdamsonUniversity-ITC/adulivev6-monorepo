import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import onlyWarn from "eslint-plugin-only-warn";
import turboPlugin from "eslint-plugin-turbo";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
      "unused-imports": unusedImports,
    },
    rules: {
      "semi": ["error", "always"],
      "turbo/no-undeclared-env-vars": "warn",
       "no-unused-vars": "off",
       "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
       "unused-imports/no-unused-imports": "warn",
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ["dist/**"],
  },
];
