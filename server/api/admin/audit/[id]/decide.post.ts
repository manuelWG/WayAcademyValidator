import {
  auditConflictIdParamSchema,
  auditDecisionBodySchema
} from '../../../../../shared/schemas/import-api'
import { decideAuditConflict } from '../../../../services/audit.service'
import { readStrictJsonBody } from '../../../../utils/request-guards'
import { requireActiveAdmin } from '../../../../utils/require-admin'

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)

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

  const body = await readStrictJsonBody(event, auditDecisionBodySchema)
  return decideAuditConflict(id, body.decision, body.observation, admin.id)
})
