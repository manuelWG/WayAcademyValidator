<script setup lang="ts">
import type { ImportBatch } from '../../types/import'

defineProps<{
  imports: ImportBatch[]
}>()
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-default">
    <table class="w-full min-w-[1000px] text-left text-sm">
      <thead class="bg-elevated/60 text-muted">
        <tr>
          <th class="px-3 py-3 font-medium">
            Archivo
          </th>
          <th class="px-3 py-3 font-medium">
            Curso
          </th>
          <th class="px-3 py-3 font-medium">
            Usuario
          </th>
          <th class="px-3 py-3 font-medium">
            Fecha
          </th>
          <th class="px-3 py-3 font-medium">
            Total
          </th>
          <th class="px-3 py-3 font-medium">
            Nuevos
          </th>
          <th class="px-3 py-3 font-medium">
            Sin cambios
          </th>
          <th class="px-3 py-3 font-medium">
            Conflictos
          </th>
          <th class="px-3 py-3 font-medium">
            Errores
          </th>
          <th class="px-3 py-3 font-medium">
            Estado
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in imports"
          :key="item.id"
          class="border-t border-default"
        >
          <td class="px-3 py-3">
            <NuxtLink
              :to="`/admin/importaciones/${item.id}`"
              class="font-medium text-highlighted hover:underline"
            >
              {{ item.originalFileName }}
            </NuxtLink>
          </td>
          <td class="px-3 py-3 text-muted">
            {{ item.courseName }}
          </td>
          <td class="px-3 py-3 text-muted">
            {{ item.importedBy }}
          </td>
          <td class="px-3 py-3 text-muted">
            {{ formatDateTime(item.importedAt) }}
          </td>
          <td class="px-3 py-3">
            {{ item.counters.total }}
          </td>
          <td class="px-3 py-3">
            {{ item.counters.new }}
          </td>
          <td class="px-3 py-3">
            {{ item.counters.unchanged }}
          </td>
          <td class="px-3 py-3">
            {{ item.counters.conflicts + item.counters.updatable }}
          </td>
          <td class="px-3 py-3">
            {{ item.counters.errors }}
          </td>
          <td class="px-3 py-3">
            <SharedStatusBadge :status="item.status" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
