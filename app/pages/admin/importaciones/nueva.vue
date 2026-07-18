<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})
</script>

<template>
  <div>
    <SharedPageHeader
      title="Nueva importación"
      description="Carga, valida y confirma un archivo CSV en el servidor"
    />
    <AdminImportWizard />
  </div>
</template>
