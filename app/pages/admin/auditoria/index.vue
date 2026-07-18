<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const { conflicts, list } = useAudit()
const loading = ref(true)

onMounted(async () => {
  try {
    await list()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <SharedPageHeader
      title="Auditoría"
      description="Diferencias detectadas sobre certificados existentes. El snapshot publicado no se modifica automáticamente."
    />

    <SharedLoadingBlock v-if="loading" />
    <div
      v-else-if="conflicts.length"
      class="space-y-3"
    >
      <AdminAuditConflictCard
        v-for="item in conflicts"
        :key="item.id"
        :conflict="item"
      />
    </div>
    <SharedEmptyState
      v-else
      title="Sin registros de auditoría"
    />
  </div>
</template>
