import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.spec.ts'],
          environment: 'node',
          reporters: ['default']
        }
      },
      defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['tests/nuxt/**/*.spec.ts'],
          environment: 'nuxt',
          reporters: ['default'],
          hookTimeout: 120000,
          testTimeout: 30000,
          environmentOptions: {
            nuxt: {
              domEnvironment: 'happy-dom',
              overrides: {
                runtimeConfig: {
                  session: {
                    // Fictional password for Nuxt Auth Utils in the test environment.
                    password: 'test-session-password-min-32-chars!!'
                  }
                }
              }
            }
          }
        }
      })
    ]
  }
})
