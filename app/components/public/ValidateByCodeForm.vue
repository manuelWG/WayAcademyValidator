<script setup lang="ts">
import type { CertificatePublicResult } from '../../types/certificate'

const emit = defineEmits<{
  result: [CertificatePublicResult | null]
  searching: [boolean]
}>()

const code = ref('')
const error = ref('')
const loading = ref(false)
const { findByCode } = useCertificates()

async function onSubmit() {
  error.value = ''
  const value = code.value.trim()
  if (!value) {
    error.value = 'Ingresa el código del certificado.'
    return
  }
  if (value.length < 6) {
    error.value = 'El código debe tener al menos 6 caracteres.'
    return
  }
  if (!/^[A-Za-z0-9\-]+$/.test(value)) {
    error.value = 'El código solo puede contener letras, números y guiones.'
    return
  }

  loading.value = true
  emit('searching', true)
  try {
    const result = await findByCode(value)
    emit('result', result)
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
      label="Código del certificado"
      :error="error"
      name="certificateCode"
    >
      <UInput
        v-model="code"
        placeholder="Ej. WAY-LDR-2025-0042"
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
      :loading="loading"
      icon="i-lucide-shield-check"
    >
      Validar certificado
    </UButton>
  </form>
</template>
