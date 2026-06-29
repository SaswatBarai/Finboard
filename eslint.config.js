import js from "@eslint/js";

export default [
  js.configs.recommended,
  // ── Base config (all files) ────────────────────────────────────────────────
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        __dirname: "readonly",
        __filename: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": "off",
      "prefer-const": "error",
      "no-var": "error",
      // Allow `!= null` / `== null` — intentional null+undefined guard
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-throw-literal": "error"
    }
  },
  // ── Next.js app — browser globals + JSX ───────────────────────────────────
  {
    files: ["apps/customer-web/**/*.{js,jsx,mjs}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        FormData: "readonly",
        fetch: "readonly",
        Event: "readonly",
        CustomEvent: "readonly",
        HTMLElement: "readonly",
        Element: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        MutationObserver: "readonly",
        ResizeObserver: "readonly",
        IntersectionObserver: "readonly"
      }
    }
  },
  // ── Node scripts — fetch is built-in since Node 18 ────────────────────────
  {
    files: ["infrastructure/scripts/**/*.{js,mjs}", "fixtures/**/*.{js,mjs}"],
    languageOptions: {
      globals: {
        fetch: "readonly"
      }
    }
  },
  // ── Ignores ────────────────────────────────────────────────────────────────
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "infrastructure/storage/**",
      "services/banking-service/prisma/migrations/**"
    ]
  }
];
