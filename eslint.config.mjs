import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  // Aislamiento del panel nuevo (PLAN.md, PN-00): no depende del panel viejo salvo por src/lib/panel/legado, y el viejo no depende del nuevo.
  {
    files: ["src/app/admin/**/*.{ts,tsx}", "src/components/panel/**/*.{ts,tsx}", "src/lib/panel/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["@/components/admin", "@/components/admin/*", "@/lib/admin", "@/lib/admin/*", "@/app/admin-anterior", "@/app/admin-anterior/*"],
          message: "El panel nuevo no importa del panel viejo. Si hace falta algo, pásalo por src/lib/panel/legado (ver AGENTS.md).",
        }],
      }],
    },
  },
  { files: ["src/lib/panel/legado/**/*.ts"], rules: { "no-restricted-imports": "off" } },
  {
    files: ["src/app/admin-anterior/**/*.{ts,tsx}", "src/components/admin/**/*.{ts,tsx}", "src/lib/admin/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["@/components/panel", "@/components/panel/*", "@/lib/panel", "@/lib/panel/*", "@/app/admin", "@/app/admin/*"],
          message: "El panel viejo va a desaparecer: no puede depender del panel nuevo.",
        }],
      }],
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "out/**", "tmp/**", ".superpowers/**", ".claude/**"],
  },
];

export default eslintConfig;
