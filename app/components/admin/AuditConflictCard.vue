<script setup lang="ts">
import type { AuditConflict } from '../../types/audit'

defineProps<{
  conflict: AuditConflict
}>()
</script>

<template>
  <NuxtLink
    :to="`/admin/auditoria/${conflict.id}`"
    class="block rounded-xl border border-default p-4 space-y-3 transition-colors hover:bg-elevated/40"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="font-mono font-medium text-highlighted">
        {{ conflict.certificateCode }}
      </p>
      <div class="flex gap-2">
        <SharedStatusBadge :status="conflict.riskLevel" />
        <SharedStatusBadge :status="conflict.status" />
      </div>
    </div>
    <p class="text-sm text-muted">
      {{ conflict.courseName }}
    </p>
    <p class="text-xs text-muted">
      {{ conflict.originalFileName }} · Fila {{ conflict.csvRowNumber }} ·
      {{ formatDateTime(conflict.detectedAt) }}
    </p>
    <p class="text-sm">
      Campos modificados:
      <span class="font-medium">{{ conflict.changedFields.join(', ') }}</span>
    </p>
  </NuxtLink>
</template>
