import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // openmaic is a separate Next.js workspace with its own ESLint config.
    "openmaic/**",
  ]),
  {
    rules: {
      // These React Compiler diagnostics are not actionable in the current
      // codebase: effects intentionally synchronize external APIs and refs are
      // intentionally used to keep async callbacks fresh. The workspace's
      // existing patterns and tests rely on this behavior.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/static-components": "off",
      "react-hooks/purity": "off",
      // Logos and user-provided media are intentionally rendered with plain img
      // elements; their dimensions and source domains are runtime-dependent.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
