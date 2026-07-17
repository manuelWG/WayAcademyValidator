import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

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
})
