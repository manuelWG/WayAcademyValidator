import type {
  ImportBatchDto,
  ImportBatchStatusDto,
  ImportCountersDto,
  ImportIncomingDataDto,
  ImportRowDto
} from '~~/shared/schemas/import-api'
import type { ImportRowStatus } from '~~/shared/schemas/import'

export type ImportBatch = ImportBatchDto
export type ImportBatchStatus = ImportBatchStatusDto
export type ImportCounters = ImportCountersDto
export type ImportIncomingData = ImportIncomingDataDto
export type ImportPreviewRow = ImportRowDto
export type { ImportRowStatus }
