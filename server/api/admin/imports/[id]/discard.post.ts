import { importBatchIdParamSchema } from '../../../../../shared/schemas/import-api'
import { discardImportBatch } from '../../../../services/imports.service'
import { assertAdminOrigin } from '../../../../utils/request-guards'
import { requireActiveAdmin } from '../../../../utils/require-admin'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  assertAdminOrigin(event)

  let id: string
  try {
    id = importBatchIdParamSchema.parse(getRouterParam(event, 'id'))
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Id de lote invÃ¡lido' })
  }
  return discardImportBatch(id)
})
