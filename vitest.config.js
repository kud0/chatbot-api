import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Enable globals (describe, it, expect, etc.)
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.js',
        '**/*.spec.js',
        '**/fixtures/',
        'vitest.config.js',
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },

    // Setup files
    setupFiles: ['./tests/setup.js'],

    // Test timeout
    testTimeout: 10000,

    // Mock reset
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,

    // Parallel execution
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },

    // Include/exclude patterns
    include: ['tests/**/*.{test,spec}.js'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
  },
});
