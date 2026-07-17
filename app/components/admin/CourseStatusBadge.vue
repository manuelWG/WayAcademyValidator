<script setup lang="ts">
defineProps<{
  published: boolean
}>()
</script>

<template>
  <SharedStatusBadge
    :status="published ? 'published' : 'unpublished'"
  />
</template>
