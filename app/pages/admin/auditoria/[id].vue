<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const route = useRoute()
const { getById, decide } = useAudit()
const toast = useToast()

const conflict = ref<Awaited<ReturnType<typeof getById>>>(null)
const observation = ref('')
const loading = ref(false)
const pageLoading = ref(true)

onMounted(async () => {
  conflict.value = await getById(String(route.params.id))
  pageLoading.value = false
})

async function onDecide(decision: 'accepted' | 'rejected') {
  if (!conflict.value) return
  if (!observation.value.trim()) {
    toast.add({ title: 'Escribe una observación', color: 'error' })
    return
  }
  loading.value = true
  try {
    conflict.value = await decide(
      conflict.value.id,
      decision,
      observation.value
    )
    toast.add({
      title: decision === 'accepted' ? 'Conflicto aceptado' : 'Conflicto rechazado',
      description: decision === 'accepted'
        ? 'La decisión quedó registrada. El snapshot publicado no se modifica automáticamente.'
        : 'Se conserva el snapshot publicado.',
      color: decision === 'accepted' ? 'success' : 'neutral'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <SharedLoadingBlock v-if="pageLoading" />
    <SharedEmptyState
      v-else-if="!conflict"
      title="Conflicto no encontrado"
    >
      <UButton to="/admin/auditoria">
        Volver
      </UButton>
    </SharedEmptyState>

    <template v-else>
      <SharedPageHeader
        :title="conflict.certificateCode"
        :description="conflict.courseName"
      >
        <template #actions>
          <SharedStatusBadge :status="conflict.riskLevel" />
          <SharedStatusBadge :status="conflict.status" />
        </template>
      </SharedPageHeader>

      <UAlert
        class="mb-6"
        color="info"
        variant="subtle"
        title="Regla de snapshot"
        description="Aceptar un conflicto no aplica el cambio al certificado publicado. Solo registra la decisión administrativa."
      />

      <AdminAuditDiffPanel
        :conflict="conflict"
        class="mb-8"
      />

      <div
        v-if="conflict.status === 'pending'"
        class="max-w-xl space-y-4 rounded-xl border border-default p-5"
      >
        <h2 class="font-medium text-highlighted">
          Decisión administrativa
        </h2>
        <UFormField label="Observación">
          <UTextarea
            v-model="observation"
            :rows="3"
            placeholder="Motivo de la decisión"
          />
        </UFormField>
        <div class="flex flex-wrap gap-2">
          <UButton
            color="success"
            :loading="loading"
            @click="onDecide('accepted')"
          >
            Aceptar
          </UButton>
          <UButton
            color="error"
            variant="soft"
            :loading="loading"
            @click="onDecide('rejected')"
          >
            Rechazar
          </UButton>
        </div>
      </div>

      <div
        v-else
        class="rounded-xl border border-default p-5 text-sm space-y-2"
      >
        <p><span class="text-muted">Revisado por:</span> {{ conflict.reviewedBy }}</p>
        <p><span class="text-muted">Fecha:</span> {{ formatDateTime(conflict.reviewedAt) }}</p>
        <p><span class="text-muted">Observación:</span> {{ conflict.observation }}</p>
      </div>
    </template>
  </div>
</template>
