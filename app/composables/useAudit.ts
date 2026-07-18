import type { AuditConflict } from '../types/audit'
import { auditRepository } from '../repositories/audit.repository'

export function useAudit() {
  const conflicts = useState<AuditConflict[]>('admin-audit-list', () => [])
  const pending = computed(() => conflicts.value.filter(conflict => conflict.status === 'pending'))

  function upsert(conflict: AuditConflict) {
    conflicts.value = [conflict, ...conflicts.value.filter(item => item.id !== conflict.id)]
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
  }

  async function list() {
    const data = await auditRepository.list()
    conflicts.value = data
    return data
  }

  async function getById(id: string) {
    const conflict = await auditRepository.getById(id)
    if (conflict) upsert(conflict)
    return conflict
  }

  async function decide(id: string, decision: 'accepted' | 'rejected', observation: string) {
    const conflict = await auditRepository.decide(id, decision, observation)
    upsert(conflict)
    return conflict
  }

  return {
    conflicts,
    pending,
    list,
    getById,
    decide
  }
}
