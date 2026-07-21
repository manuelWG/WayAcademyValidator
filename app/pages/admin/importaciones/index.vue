<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const { imports, list } = useImports()
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
      title="Importaciones"
      description="Historial de importaciones CSV procesadas por el servidor"
    >
      <template #actions>
        <UButton
          to="/admin/importaciones/nueva"
          icon="i-lucide-plus"
        >
          Nueva importación
        </UButton>
      </template>
    </SharedPageHeader>

    <SharedLoadingBlock v-if="loading" />
    <AdminImportHistoryTable
      v-else-if="imports.length"
      :imports="imports"
    />
    <SharedEmptyState
      v-else
      title="Sin importaciones"
    />
  </div>
</template>
