import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '~~': root
    }
  },
  test: {
    projects: [
      {
        resolve: {
          alias: {
            '~~': root
          }
        },
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
