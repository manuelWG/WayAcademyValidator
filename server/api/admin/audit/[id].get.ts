import { auditConflictIdParamSchema } from '../../../../shared/schemas/import-api'
import { getAuditConflict } from '../../../services/audit.service'
import { requireActiveAdmin } from '../../../utils/require-admin'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)

  let id: string
  try {
    id = auditConflictIdParamSchema.parse(getRouterParam(event, 'id'))
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Id de conflicto de auditoría inválido'
    })
  }

  const conflict = await getAuditConflict(id)
  if (!conflict) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Conflicto de auditoría no encontrado'
    })
  }
  return conflict
})
