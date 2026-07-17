<script setup lang="ts">
import type { ImportPreviewRow } from '../../types/import'

defineProps<{
  rows: ImportPreviewRow[]
}>()
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-default">
    <table class="w-full min-w-[900px] text-left text-sm">
      <thead class="bg-elevated/60 text-muted">
        <tr>
          <th class="px-3 py-3 font-medium">
            Fila
          </th>
          <th class="px-3 py-3 font-medium">
            Código
          </th>
          <th class="px-3 py-3 font-medium">
            Participante
          </th>
          <th class="px-3 py-3 font-medium">
            Cédula
          </th>
          <th class="px-3 py-3 font-medium">
            Estado
          </th>
          <th class="px-3 py-3 font-medium">
            Detalle
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.rowNumber"
          class="border-t border-default align-top"
        >
          <td class="px-3 py-3 font-mono text-muted">
            {{ row.rowNumber }}
          </td>
          <td class="px-3 py-3 font-mono">
            {{ row.certificateCode || '—' }}
          </td>
          <td class="px-3 py-3">
            {{ row.participantName || '—' }}
          </td>
          <td class="px-3 py-3">
            {{ row.documentMasked }}
          </td>
          <td class="px-3 py-3">
            <SharedStatusBadge :status="row.status" />
          </td>
          <td class="px-3 py-3 text-muted max-w-xs">
            {{ row.reason }}
            <p
              v-if="row.changedFields.length"
              class="text-xs mt-1"
            >
              Campos: {{ row.changedFields.join(', ') }}
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
