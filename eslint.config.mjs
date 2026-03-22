import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    ignores: [".next/**", "coverage/**", "playwright-report/**", "test-results/**"],
  },
];

export default eslintConfig;
