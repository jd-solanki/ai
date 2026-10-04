import { defineConfig } from 'vite-plus'

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  fmt: {
    // Formatting a skill changes its hash in every repo that installed it; the skills CLI owns the rest.
    ignorePatterns: ['skills/**', '.agents/**', '.claude/**', 'skills-lock.json'],
    singleQuote: true,
    semi: false,
  },
  lint: {
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: { 'vite-plus/prefer-vite-plus-imports': 'error' },
    options: { typeAware: true, typeCheck: true },
  },
  run: {
    cache: true,
  },
})
