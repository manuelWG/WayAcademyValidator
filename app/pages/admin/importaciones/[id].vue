<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const route = useRoute()
const { getById } = useImports()
const { conflicts, list: listConflicts } = useAudit()

const loading = ref(true)
const batch = ref<Awaited<ReturnType<typeof getById>>>(null)
const relatedConflicts = computed(() =>
  conflicts.value.filter(c => c.importId === batch.value?.id)
)

onMounted(async () => {
  try {
    const [loadedBatch] = await Promise.all([
      getById(String(route.params.id)),
      listConflicts()
    ])
    batch.value = loadedBatch
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <SharedLoadingBlock v-if="loading" />
    <SharedEmptyState
      v-else-if="!batch"
      title="Importación no encontrada"
    >
      <UButton to="/admin/importaciones">
        Volver
      </UButton>
    </SharedEmptyState>

    <template v-else>
      <SharedPageHeader
        :title="batch.originalFileName"
        :description="`${batch.courseName} · ${formatDateTime(batch.importedAt)}`"
      >
        <template #actions>
          <SharedStatusBadge :status="batch.status" />
        </template>
      </SharedPageHeader>

      <div class="mb-6 rounded-xl border border-default p-4 text-sm space-y-1">
        <p><span class="text-muted">ID:</span> {{ batch.id }}</p>
        <p><span class="text-muted">Hash:</span> <span class="font-mono">{{ batch.fileHash }}</span></p>
        <p><span class="text-muted">Importado por:</span> {{ batch.importedBy }}</p>
      </div>

      <AdminImportSummary
        class="mb-6"
        :counters="batch.counters"
      />

      <h2 class="font-medium text-highlighted mb-3">
        Filas procesadas
      </h2>
      <AdminImportPreviewTable
        v-if="batch.rows.length"
        :rows="batch.rows"
        class="mb-8"
      />
      <SharedEmptyState
        v-else
        title="Sin detalle de filas en este lote histórico"
        class="mb-8"
      />

      <h2 class="font-medium text-highlighted mb-3">
        Conflictos relacionados
      </h2>
      <div
        v-if="relatedConflicts.length"
        class="space-y-3"
      >
        <AdminAuditConflictCard
          v-for="item in relatedConflicts"
          :key="item.id"
          :conflict="item"
        />
      </div>
      <SharedEmptyState
        v-else
        title="Sin conflictos para esta importación"
      />
    </template>
  </div>
</template>
