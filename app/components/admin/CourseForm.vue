<script setup lang="ts">
const props = defineProps<{
  initial?: {
    moodleCourseId?: number
    name?: string
    notes?: string
  }
  submitLabel?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: { moodleCourseId: number, name: string, notes: string }]
}>()

const moodleCourseId = ref(props.initial?.moodleCourseId?.toString() || '')
const name = ref(props.initial?.name || '')
const notes = ref(props.initial?.notes || '')
const errors = reactive({ moodleCourseId: '', name: '', notes: '' })

function validate() {
  errors.moodleCourseId = ''
  errors.name = ''
  errors.notes = ''
  const idRaw = moodleCourseId.value.trim()
  const idNum = Number(idRaw)
  if (!idRaw) errors.moodleCourseId = 'Requerido'
  else if (!/^\d+$/.test(idRaw) || !Number.isSafeInteger(idNum) || idNum <= 0) {
    errors.moodleCourseId = 'Debe ser un entero positivo válido'
  }
  const trimmedName = name.value.trim()
  if (!trimmedName) errors.name = 'Requerido'
  else if (trimmedName.length > 255) errors.name = 'Máximo 255 caracteres'
  if (notes.value.trim().length > 2000) {
    errors.notes = 'Máximo 2000 caracteres'
  }
  return !errors.moodleCourseId && !errors.name && !errors.notes
}

function onSubmit() {
  if (!validate()) return
  emit('submit', {
    moodleCourseId: Number(moodleCourseId.value),
    name: name.value,
    notes: notes.value
  })
}
</script>

<template>
  <form
    class="space-y-4 max-w-xl"
    @submit.prevent="onSubmit"
  >
    <UFormField
      label="ID del curso en Moodle"
      :error="errors.moodleCourseId"
    >
      <UInput
        v-model="moodleCourseId"
        type="number"
        :disabled="!!initial?.moodleCourseId"
        placeholder="101"
      />
    </UFormField>
    <UFormField
      label="Nombre"
      :error="errors.name"
    >
      <UInput
        v-model="name"
        placeholder="Nombre del curso"
      />
    </UFormField>
    <UFormField
      label="Notas de configuración local"
      :error="errors.notes"
    >
      <UTextarea
        v-model="notes"
        :rows="3"
        placeholder="Opcional"
      />
    </UFormField>
    <UAlert
      v-if="!initial"
      color="info"
      variant="subtle"
      title="El curso no se publica automáticamente"
      description="Tras crearlo permanecerá no publicado hasta que lo publiques manualmente."
    />
    <UButton
      type="submit"
      :loading="loading"
    >
      {{ submitLabel || 'Guardar' }}
    </UButton>
  </form>
</template>
