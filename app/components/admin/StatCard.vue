<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  hint?: string
  icon?: string
  source?: 'real' | 'demo'
}>()
</script>

<template>
  <div class="rounded-xl border border-default bg-default p-4 space-y-3">
    <div class="flex items-center justify-between gap-2">
      <p class="text-sm text-muted">
        {{ label }}
      </p>
      <div class="flex items-center gap-2">
        <span
          v-if="source === 'demo'"
          class="rounded bg-elevated px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted"
        >Demo</span>
        <span
          v-else-if="source === 'real'"
          class="rounded bg-elevated px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted"
        >Real</span>
        <UIcon
          v-if="icon"
          :name="icon"
          class="size-4 text-muted"
        />
      </div>
    </div>
    <p class="text-2xl font-semibold tracking-tight text-highlighted">
      {{ value }}
    </p>
    <p
      v-if="hint"
      class="text-xs text-muted"
    >
      {{ hint }}
    </p>
  </div>
</template>
