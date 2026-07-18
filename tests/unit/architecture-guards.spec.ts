import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function sourceFilesUnder(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && /\.(ts|vue|js|mjs)$/.test(entry.name))
    .map(entry => `${entry.parentPath ?? entry.path}/${entry.name}`)
}

describe('architecture guards', () => {
  it('pages and components do not import drizzle or server/database', () => {
    const files = [
      'app/pages/admin/login.vue',
      'app/pages/admin/index.vue',
      'app/pages/admin/cursos/index.vue',
      'app/pages/admin/cursos/nuevo.vue',
      'app/pages/admin/cursos/[id].vue',
      'app/components/admin/CourseForm.vue',
      'app/components/admin/StatCard.vue'
    ]
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      expect(source).not.toMatch(/from ['"]drizzle-orm/)
      expect(source).not.toMatch(/server\/database/)
      expect(source).not.toMatch(/@neondatabase\/serverless/)
    }
  })

  it('admin session refresh preserves Nuxt context and skips redundant fetchSession', () => {
    const composable = readFileSync('app/composables/useAdminSession.ts', 'utf8')
    const helper = readFileSync('app/utils/refresh-admin-session.ts', 'utf8')

    expect(composable).toMatch(/useNuxtApp\(\)/)
    expect(composable).toMatch(/useRequestFetch\(\)/)
    expect(composable).toMatch(/runWithContext/)
    expect(composable).not.toMatch(/refreshAdminSession\([\s\S]*fetchSession/)

    expect(helper).not.toMatch(/fetchSession\s*:/)
    expect(helper).not.toMatch(/deps\.fetchSession/)
    expect(helper).toMatch(/getSession/)
    expect(helper).toMatch(/clear/)
  })

  it('app and shared do not import server/security or node:crypto', () => {
    const files = [...sourceFilesUnder('app'), ...sourceFilesUnder('shared')]
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      expect(source, file).not.toMatch(/server\/security/)
      expect(source, file).not.toMatch(/['"]node:crypto['"]/)
    }
  })
})
