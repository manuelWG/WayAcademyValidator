<script setup lang="ts">
import type { CertificatePublicResult } from '../../types/certificate'

const emit = defineEmits<{
  results: [CertificatePublicResult[]]
  searching: [boolean]
}>()

const document = ref('')
const error = ref('')
const loading = ref(false)
const { findByDocument } = useCertificates()

async function onSubmit() {
  error.value = ''
  const value = document.value.trim()
  if (!value) {
    error.value = 'Ingresa el número de documento.'
    return
  }
  const normalized = normalizeDocument(value)
  if (normalized.length < 5) {
    error.value = 'El documento parece incompleto.'
    return
  }

  loading.value = true
  emit('searching', true)
  try {
    const results = await findByDocument(value)
    emit('results', results)
  } finally {
    loading.value = false
    emit('searching', false)
  }
}
</script>

<template>
  <form
    class="space-y-4"
    @submit.prevent="onSubmit"
  >
    <UFormField
      label="Número de cédula / documento"
      :error="error"
      name="document"
    >
      <UInput
        v-model="document"
        placeholder="Ej. 52.334.891"
        size="lg"
        class="w-full"
        autocomplete="off"
        :disabled="loading"
      />
    </UFormField>
    <UButton
      type="submit"
      size="lg"
      block
      color="neutral"
      variant="soft"
      :loading="loading"
      icon="i-lucide-search"
    >
      Consultar certificados
    </UButton>
  </form>
</template>
