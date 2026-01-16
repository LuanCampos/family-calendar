import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, ...tseslint.configs.strict],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      
      // React Refresh - allow files that export components + hooks/constants (common pattern in contexts)
      "react-refresh/only-export-components": "off",
      
      // React Hooks - disable exhaustive-deps (intentionally omit deps to avoid infinite loops)
      "react-hooks/exhaustive-deps": "off",
      
      // Type safety rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-empty-object-type": "off", // Allow empty interfaces from external libs
      
      // Naming conventions - allow snake_case for database types, PascalCase for React components
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "default",
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
        },
        {
          selector: "import",
          format: ["camelCase", "PascalCase"],
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        {
          selector: "enumMember",
          format: ["UPPER_CASE"],
        },
        // Allow snake_case in object literal properties (database fields)
        {
          selector: "objectLiteralProperty",
          format: null,
        },
        // Allow snake_case in type properties (database types)
        {
          selector: "typeProperty",
          format: null,
        },
        // Allow any format for object literal methods (e.g., IconLeft, IconRight from react-day-picker)
        {
          selector: "objectLiteralMethod",
          format: null,
        },
      ],
    },
  },
);

