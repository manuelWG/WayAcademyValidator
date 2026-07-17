<script setup lang="ts">
defineProps<{
  label?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-10">
    <UIcon
      name="i-lucide-loader-circle"
      class="size-8 animate-spin text-primary"
    />
    <p class="text-sm text-muted">
      {{ label || 'Cargando…' }}
    </p>
  </div>
</template>
