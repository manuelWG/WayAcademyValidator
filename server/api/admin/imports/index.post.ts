import { getRequestHeader, readMultipartFormData } from 'h3'
import { importCourseIdFieldSchema } from '../../../../shared/schemas/import-api'
import { createImportBatch } from '../../../services/imports.service'
import { assertAdminOrigin } from '../../../utils/request-guards'
import { requireActiveAdmin } from '../../../utils/require-admin'

const MAX_IMPORT_BYTES = 10 * 1024 * 1024
const MAX_MULTIPART_BYTES = MAX_IMPORT_BYTES + (64 * 1024)

export default defineEventHandler(async (event) => {
  const admin = await requireActiveAdmin(event)
  assertAdminOrigin(event)

  const contentType = getRequestHeader(event, 'content-type')
  if (!contentType || !/^multipart\/form-data(?:\s*;|$)/i.test(contentType)) {
    throw createError({
      statusCode: 415,
      statusMessage: 'Unsupported Media Type',
      message: 'Content-Type must be multipart/form-data'
    })
  }
  const contentLength = Number(getRequestHeader(event, 'content-length'))
  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Payload Too Large', message: 'El CSV excede 10 MB' })
  }

  const parts = await readMultipartFormData(event)
  if (!parts) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Formulario multipart invÃ¡lido' })
  }
  const files = parts.filter(part => part.name === 'file' && part.filename)
  const courseFields = parts.filter(part => part.name === 'courseId' && !part.filename)
  if (files.length !== 1 || courseFields.length !== 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Se requiere exactamente un file y un courseId'
    })
  }

  const file = files[0]!
  if (file.data.length > MAX_IMPORT_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Payload Too Large', message: 'El CSV excede 10 MB' })
  }
  if (!file.filename!.toLowerCase().endsWith('.csv')) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'El archivo debe tener extensiÃ³n .csv' })
  }
  if (file.filename!.length > 255) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'El nombre del archivo es demasiado largo' })
  }

  let courseId: string
  try {
    courseId = importCourseIdFieldSchema.parse(courseFields[0]!.data.toString('utf8'))
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'courseId invÃ¡lido' })
  }

  const batch = await createImportBatch({ fileName: file.filename!, data: file.data }, courseId, admin.id)
  setResponseStatus(event, 201)
  return batch
})
