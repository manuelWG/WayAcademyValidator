import { importsRepository } from '../repositories/imports.repository'
import { useMockStore } from './useMockStore'

export function useImports() {
  const store = useMockStore()
  const imports = computed(() =>
    [...store.value.imports].sort(
      (a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
    )
  )

  return {
    imports,
    list: importsRepository.list,
    getById: importsRepository.getById,
    validateStructure: importsRepository.validateStructure,
    simulatePreview: importsRepository.simulatePreview,
    confirmImport: importsRepository.confirmImport
  }
}
