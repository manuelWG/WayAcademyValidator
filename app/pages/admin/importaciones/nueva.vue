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
      description="Asistente visual con procesamiento simulado"
    />
    <AdminImportWizard />
  </div>
</template>
