import { listImportBatches } from '../../../services/imports.service'
import { requireActiveAdmin } from '../../../utils/require-admin'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  return listImportBatches()
})
