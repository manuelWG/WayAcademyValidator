<script setup lang="ts">
import type { CertificatePublicResult } from '../types/certificate'

definePageMeta({
  layout: 'default'
})

const activeTab = ref('code')
const searching = ref(false)
const codeResult = ref<CertificatePublicResult | null | undefined>(undefined)
const docResults = ref<CertificatePublicResult[] | null>(null)
const docSearched = ref(false)

function onCodeResult(result: CertificatePublicResult | null) {
  codeResult.value = result
}

function onDocResults(results: CertificatePublicResult[]) {
  docResults.value = results
  docSearched.value = true
}
</script>

<template>
  <div class="relative">
    <div class="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/8 to-transparent" />

    <div class="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div class="mb-10 space-y-3 text-center">
        <p class="text-sm font-medium text-primary">
          Validación pública
        </p>
        <h1 class="text-3xl font-semibold tracking-tight text-highlighted sm:text-4xl">
          WayAcademyValidator
        </h1>
        <p class="mx-auto max-w-xl text-muted">
          Verifica un certificado por su código o consulta todos los certificados asociados a un documento.
        </p>
      </div>

      <div class="rounded-2xl border border-default bg-default/90 p-5 shadow-sm sm:p-8 backdrop-blur">
        <UTabs
          v-model="activeTab"
          :items="[
            { label: 'Validar por código', value: 'code', icon: 'i-lucide-shield-check' },
            { label: 'Consultar por cédula', value: 'document', icon: 'i-lucide-id-card' }
          ]"
          class="w-full"
        />

        <div class="mt-6">
          <template v-if="activeTab === 'code'">
            <PublicValidateByCodeForm
              @result="onCodeResult"
              @searching="searching = $event"
            />
            <div class="mt-6">
              <SharedLoadingBlock
                v-if="searching"
                label="Validando certificado…"
              />
              <PublicCertificateValidCard
                v-else-if="codeResult"
                :result="codeResult"
              />
              <PublicCertificateNotFound
                v-else-if="codeResult === null"
              />
            </div>
          </template>

          <template v-else>
            <PublicSearchByDocumentForm
              @results="onDocResults"
              @searching="searching = $event"
            />
            <div class="mt-6 space-y-3">
              <SharedLoadingBlock
                v-if="searching"
                label="Consultando certificados…"
              />
              <template v-else-if="docSearched">
                <SharedEmptyState
                  v-if="!docResults?.length"
                  title="Sin resultados"
                  description="No se encontraron certificados públicos asociados a ese documento."
                  icon="i-lucide-file-x"
                />
                <PublicCertificateListItem
                  v-for="item in docResults"
                  v-else
                  :key="item.certificate.id"
                  :certificate="item.certificate"
                />
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
