<script setup lang="ts">
const props = defineProps<{
  status: string
  label?: string
}>()

const color = computed(() => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary'> = {
    pending: 'warning',
    accepted: 'success',
    rejected: 'error',
    completed: 'success',
    completed_with_conflicts: 'warning',
    failed: 'error',
    new: 'success',
    unchanged: 'neutral',
    conflict: 'info',
    critical_conflict: 'error',
    error: 'error',
    published: 'success',
    unpublished: 'neutral',
    critical: 'error',
    high: 'warning',
    medium: 'info',
    valid: 'success'
  }
  return map[props.status] || 'neutral'
})

const display = computed(() => {
  if (props.label) return props.label
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    accepted: 'Aceptado',
    rejected: 'Rechazado',
    completed: 'Completada',
    completed_with_conflicts: 'Con conflictos',
    failed: 'Fallida',
    new: 'Nueva',
    unchanged: 'Sin cambios',
    conflict: 'Conflicto',
    critical_conflict: 'Conflicto crítico',
    error: 'Error',
    published: 'Publicado',
    unpublished: 'No publicado',
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Medio',
    valid: 'Certificado válido'
  }
  return labels[props.status] || props.status
})
</script>

<template>
  <UBadge
    :color="color"
    variant="subtle"
  >
    {{ display }}
  </UBadge>
</template>
