import type { ImportBatch } from '../types/import'
import { importsRepository } from '../repositories/imports.repository'

export function useImports() {
  const imports = useState<ImportBatch[]>('admin-imports-list', () => [])

  function upsert(batch: ImportBatch) {
    imports.value = [batch, ...imports.value.filter(item => item.id !== batch.id)]
      .sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime())
  }

  async function list() {
    const data = await importsRepository.list()
    imports.value = data
    return data
  }

  async function getById(id: string) {
    const batch = await importsRepository.getById(id)
    if (batch) upsert(batch)
    return batch
  }

  async function upload(courseId: string, file: File) {
    const batch = await importsRepository.upload(courseId, file)
    upsert(batch)
    return batch
  }

  async function confirm(id: string) {
    const batch = await importsRepository.confirm(id)
    upsert(batch)
    return batch
  }

  async function discard(id: string) {
    const batch = await importsRepository.discard(id)
    upsert(batch)
    return batch
  }

  return {
    imports,
    list,
    getById,
    upload,
    confirm,
    discard
  }
}
