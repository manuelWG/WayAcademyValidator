<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold tracking-tight text-highlighted">
        {{ title }}
      </h1>
      <p
        v-if="description"
        class="text-sm text-muted"
      >
        {{ description }}
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
