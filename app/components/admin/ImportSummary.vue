<script setup lang="ts">
import type { ImportCounters } from '../../types/import'

defineProps<{
  counters: ImportCounters
  title?: string
}>()
</script>

<template>
  <div class="rounded-xl border border-default p-5 space-y-4">
    <h3 class="font-medium text-highlighted">
      {{ title || 'Resumen de importación' }}
    </h3>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <div>
        <p class="text-xs text-muted">
          Total
        </p>
        <p class="text-xl font-semibold">
          {{ counters.total }}
        </p>
      </div>
      <div>
        <p class="text-xs text-muted">
          Nuevas
        </p>
        <p class="text-xl font-semibold text-success">
          {{ counters.new }}
        </p>
      </div>
      <div>
        <p class="text-xs text-muted">
          Sin cambios
        </p>
        <p class="text-xl font-semibold">
          {{ counters.unchanged }}
        </p>
      </div>
      <div>
        <p class="text-xs text-muted">
          Con cambios
        </p>
        <p class="text-xl font-semibold text-info">
          {{ counters.updatable }}
        </p>
      </div>
      <div>
        <p class="text-xs text-muted">
          Conflictos
        </p>
        <p class="text-xl font-semibold text-warning">
          {{ counters.conflicts }}
        </p>
      </div>
      <div>
        <p class="text-xs text-muted">
          Errores
        </p>
        <p class="text-xl font-semibold text-error">
          {{ counters.errors }}
        </p>
      </div>
    </div>
  </div>
</template>
