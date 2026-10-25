import nextEslintConfig from "@eslint/eslintrc/dist/eslintrc.cjs";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextEslintConfig.defaults.nexteslint,
  ...nextEslintConfig.defaults["next/typescript"],
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
];
