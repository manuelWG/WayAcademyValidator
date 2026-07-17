<script setup lang="ts">
import type { AuditConflict } from '../../types/audit'

defineProps<{
  conflicts: AuditConflict[]
}>()
</script>

<template>
  <div class="space-y-3">
    <NuxtLink
      v-for="item in conflicts"
      :key="item.id"
      :to="`/admin/auditoria/${item.id}`"
      class="block rounded-xl border border-default p-4 transition-colors hover:bg-elevated/40"
    >
      <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p class="font-mono text-sm font-medium text-highlighted">
          {{ item.certificateCode }}
        </p>
        <SharedStatusBadge :status="item.riskLevel" />
      </div>
      <p class="text-sm text-muted">
        {{ item.courseName }} · Fila {{ item.csvRowNumber }} · {{ item.originalFileName }}
      </p>
      <p class="text-xs text-muted mt-1">
        Campos: {{ item.changedFields.join(', ') || '—' }}
      </p>
    </NuxtLink>
  </div>
</template>
