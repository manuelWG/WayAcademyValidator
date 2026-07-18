import { importBatchIdParamSchema } from '../../../../shared/schemas/import-api'
import { getImportBatch } from '../../../services/imports.service'
import { requireActiveAdmin } from '../../../utils/require-admin'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)

  let id: string
  try {
    id = importBatchIdParamSchema.parse(getRouterParam(event, 'id'))
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Id de lote invÃ¡lido' })
  }
  const batch = await getImportBatch(id)
  if (!batch) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'Lote no encontrado' })
  }
  return batch
})
