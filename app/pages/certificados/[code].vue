<script setup lang="ts">
import type { CertificatePublicResult } from '../../types/certificate'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const { getByCode } = useCertificates()

const loading = ref(true)
const result = ref<CertificatePublicResult | null>(null)

onMounted(async () => {
  const code = String(route.params.code || '')
  result.value = await getByCode(decodeURIComponent(code))
  loading.value = false
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
    <SharedLoadingBlock
      v-if="loading"
      label="Cargando certificado…"
    />
    <PublicCertificateDetailView
      v-else-if="result"
      :result="result"
    />
    <div
      v-else
      class="space-y-4"
    >
      <SharedEmptyState
        title="Certificado no disponible"
        description="El código no corresponde a un certificado público registrado en WayAcademyValidator."
        icon="i-lucide-file-x"
      >
        <UButton to="/">
          Volver a consultar
        </UButton>
      </SharedEmptyState>
    </div>
  </div>
</template>
