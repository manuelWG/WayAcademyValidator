<script setup lang="ts">
defineProps<{
  value: string
}>()
</script>

<template>
  <span class="font-mono tracking-wide text-muted">{{ maskDocument(value) }}</span>
</template>
