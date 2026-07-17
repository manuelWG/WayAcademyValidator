<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const { conflicts } = useAudit()
</script>

<template>
  <div>
    <SharedPageHeader
      title="Auditoría"
      description="Diferencias detectadas sobre certificados existentes. El snapshot publicado no se modifica automáticamente."
    />

    <div
      v-if="conflicts.length"
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
