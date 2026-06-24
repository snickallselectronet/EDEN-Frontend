import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    watch: false,                         // one-shot by default
    environment: "jsdom",
    setupFiles: ["./src/tests/setupTests.tsx"],
    globals: true,
    css: false,
    include: ["src/tests/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/*.d.ts",
        "src/tests/**",
        "**/*.{test,spec}.{ts,tsx}",
        // entry/wiring
        "src/main.tsx",
        // map & pdf handled by Playwright
        "src/components/MapComponent.tsx",
        "src/components/PDFComponent.tsx",
        "src/components/pdfComponents/**",
        // constants-only modules
        "src/constants/**",
        // thin axios wrapper
        "src/utilities/api.ts"
      ],
    },
  },
  resolve: {
    alias: {
      "@": "/src",
      "@components": "/src/components",
      "@utilities": "/src/utilities",
    },
  },
});
