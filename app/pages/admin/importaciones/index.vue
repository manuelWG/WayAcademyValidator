<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const { imports } = useImports()
</script>

<template>
  <div>
    <SharedPageHeader
      title="Importaciones"
      description="Historial de importaciones CSV simuladas"
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

    <AdminImportHistoryTable
      v-if="imports.length"
      :imports="imports"
    />
    <SharedEmptyState
      v-else
      title="Sin importaciones"
    />
  </div>
</template>
