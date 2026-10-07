import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"] },
  {
    rules: {
      // Standard "load data on mount" effects predate this React Compiler-era rule.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
