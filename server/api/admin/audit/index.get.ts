import { listAuditConflicts } from '../../../services/audit.service'
import { requireActiveAdmin } from '../../../utils/require-admin'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  return listAuditConflicts()
})
