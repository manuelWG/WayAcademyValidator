import { auditRepository } from '../repositories/audit.repository'
import { useMockStore } from './useMockStore'

export function useAudit() {
  const store = useMockStore()
  const conflicts = computed(() =>
    [...store.value.auditConflicts].sort(
      (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
    )
  )
  const pending = computed(() => conflicts.value.filter(c => c.status === 'pending'))

  return {
    conflicts,
    pending,
    list: auditRepository.list,
    getById: auditRepository.getById,
    decide: auditRepository.decide
  }
}
