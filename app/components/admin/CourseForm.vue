<script setup lang="ts">
import {
  isMoodleCourseIdFieldDisabled,
  moodleCourseIdFieldValue,
  parseMoodleCourseIdInput
} from '../../utils/parse-moodle-course-id'

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

const moodleCourseId = ref(moodleCourseIdFieldValue(props.initial?.moodleCourseId))
const name = ref(props.initial?.name || '')
const notes = ref(props.initial?.notes || '')
const errors = reactive({ moodleCourseId: '', name: '', notes: '' })
const moodleIdDisabled = computed(() =>
  isMoodleCourseIdFieldDisabled(props.initial?.moodleCourseId)
)

function validate() {
  errors.moodleCourseId = ''
  errors.name = ''
  errors.notes = ''

  const parsed = parseMoodleCourseIdInput(moodleCourseId.value)
  if (!parsed.ok) {
    errors.moodleCourseId = parsed.error
  }

  const trimmedName = name.value.trim()
  if (!trimmedName) errors.name = 'Requerido'
  else if (trimmedName.length > 255) errors.name = 'Máximo 255 caracteres'
  if (notes.value.trim().length > 2000) {
    errors.notes = 'Máximo 2000 caracteres'
  }

  if (errors.moodleCourseId || errors.name || errors.notes || !parsed.ok) {
    return null
  }
  return parsed.value
}

function onSubmit() {
  const idNum = validate()
  if (idNum == null) return
  emit('submit', {
    moodleCourseId: idNum,
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
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        :disabled="moodleIdDisabled"
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
