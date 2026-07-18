<script setup lang="ts">
import type { AuditConflict } from '../../types/audit'

defineProps<{
  conflict: AuditConflict
}>()

function fieldLabel(field: string) {
  const map: Record<string, string> = {
    participantName: 'Nombre del participante',
    documentNumberNormalized: 'Cédula',
    userId: 'Usuario Moodle',
    courseId: 'Curso asociado',
    certificateIssueId: 'certificate_issue_id',
    certificateCode: 'Código',
    issuedAt: 'Fecha de expedición',
    courseName: 'Nombre del curso'
  }
  return map[field] || field
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-xl border border-default p-4 space-y-3">
        <h3 class="font-medium text-highlighted">
          Snapshot publicado (actual)
        </h3>
        <dl
          v-if="conflict.storedSnapshot"
          class="space-y-2 text-sm"
        >
          <div class="flex justify-between gap-2">
            <dt class="text-muted">
              Participante
            </dt>
            <dd>{{ conflict.storedSnapshot.participantName }}</dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-muted">
              Documento
            </dt>
            <dd class="font-mono">
              No expuesto por seguridad
            </dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-muted">
              Curso
            </dt>
            <dd>{{ conflict.storedSnapshot.courseName }}</dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-muted">
              Expedición
            </dt>
            <dd>{{ formatDate(conflict.storedSnapshot.issuedAt) }}</dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-muted">
              issue_id
            </dt>
            <dd class="font-mono">
              {{ conflict.storedSnapshot.certificateIssueId }}
            </dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-muted">
              user_id
            </dt>
            <dd class="font-mono">
              {{ conflict.storedSnapshot.userId }}
            </dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-muted">
              course_id
            </dt>
            <dd class="font-mono">
              {{ conflict.storedSnapshot.courseId }}
            </dd>
          </div>
        </dl>
        <p
          v-else
          class="text-sm text-muted"
        >
          No hay un snapshot único disponible para este conflicto.
        </p>
      </div>

      <div class="rounded-xl border border-warning/40 bg-warning/5 p-4 space-y-3">
        <h3 class="font-medium text-highlighted">
          Datos entrantes
        </h3>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between gap-2">
            <dt class="text-muted">
              Participante
            </dt>
            <dd :class="{ 'font-semibold text-warning': conflict.changedFields.includes('participantName') }">
              {{ conflict.incomingData.participantName }}
            </dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-muted">
              Documento
            </dt>
            <dd
              class="font-mono"
              :class="{ 'font-semibold text-warning': conflict.changedFields.includes('documentNumberNormalized') }"
            >
              {{ conflict.documentMasked }}
            </dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-muted">
              Curso
            </dt>
            <dd>{{ conflict.incomingData.courseName }}</dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-muted">
              Expedición
            </dt>
            <dd>{{ formatDate(conflict.incomingData.issuedAt) }}</dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-muted">
              issue_id
            </dt>
            <dd
              class="font-mono"
              :class="{ 'font-semibold text-warning': conflict.changedFields.includes('certificateIssueId') }"
            >
              {{ conflict.incomingData.certificateIssueId }}
            </dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-muted">
              user_id
            </dt>
            <dd
              class="font-mono"
              :class="{ 'font-semibold text-warning': conflict.changedFields.includes('userId') }"
            >
              {{ conflict.incomingData.userId }}
            </dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-muted">
              course_id
            </dt>
            <dd
              class="font-mono"
              :class="{ 'font-semibold text-warning': conflict.changedFields.includes('courseId') }"
            >
              {{ conflict.incomingData.courseId }}
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <div class="rounded-xl border border-default p-4 space-y-2">
      <h3 class="font-medium text-highlighted">
        Campos modificados
      </h3>
      <ul class="flex flex-wrap gap-2">
        <li
          v-for="field in conflict.changedFields"
          :key="field"
        >
          <UBadge
            color="warning"
            variant="subtle"
          >
            {{ fieldLabel(field) }}
          </UBadge>
        </li>
      </ul>
    </div>

    <div class="rounded-xl border border-default p-4 space-y-2 text-sm">
      <h3 class="font-medium text-highlighted">
        Trazabilidad
      </h3>
      <p><span class="text-muted">Archivo:</span> {{ conflict.originalFileName }}</p>
      <p><span class="text-muted">Hash:</span> <span class="font-mono">{{ conflict.fileHash }}</span></p>
      <p><span class="text-muted">Importación:</span> {{ conflict.importId }}</p>
      <p><span class="text-muted">Fila CSV:</span> {{ conflict.csvRowNumber }}</p>
      <p><span class="text-muted">Importado por:</span> {{ conflict.importedBy }}</p>
      <p><span class="text-muted">Detectado:</span> {{ formatDateTime(conflict.detectedAt) }}</p>
    </div>
  </div>
</template>
