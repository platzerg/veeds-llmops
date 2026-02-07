import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test file patterns
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    
    // Enable globals (describe, it, expect) without imports
    globals: true,
    
    // TypeScript support
    environment: 'node',
    
    // Test timeout (useful for property-based tests)
    testTimeout: 30000,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['*.ts'],
      exclude: ['vitest.config.ts', 'tests/**/*', 'dist/**/*'],
    },
    
    // Reporter configuration
    reporters: ['verbose'],
    
    // Fail fast on first error (optional, can be disabled)
    bail: 0,
  },
});
