<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  hint?: string
  icon?: string
}>()
</script>

<template>
  <div class="rounded-xl border border-default bg-default p-4 space-y-3">
    <div class="flex items-center justify-between gap-2">
      <p class="text-sm text-muted">
        {{ label }}
      </p>
      <UIcon
        v-if="icon"
        :name="icon"
        class="size-4 text-muted"
      />
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
