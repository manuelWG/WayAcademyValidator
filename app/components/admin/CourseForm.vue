<script setup lang="ts">
import {
  clearCourseFormFieldError,
  emptyCourseFormErrors,
  formFieldError,
  validateCourseForm
} from '../../utils/course-form-validation'
import {
  isMoodleCourseIdFieldDisabled,
  moodleCourseIdFieldValue
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
const errors = reactive(emptyCourseFormErrors())
const moodleIdDisabled = computed(() =>
  isMoodleCourseIdFieldDisabled(props.initial?.moodleCourseId)
)

watch(moodleCourseId, () => {
  clearCourseFormFieldError(errors, 'moodleCourseId')
})
watch(name, () => {
  clearCourseFormFieldError(errors, 'name')
})
watch(notes, () => {
  clearCourseFormFieldError(errors, 'notes')
})

function onSubmit() {
  if (props.loading) return

  const result = validateCourseForm({
    moodleCourseId: moodleCourseId.value,
    name: name.value,
    notes: notes.value
  })

  Object.assign(errors, result.errors)
  if (!result.ok) return

  emit('submit', {
    moodleCourseId: result.moodleCourseId,
    name: name.value,
    notes: notes.value
  })
}
</script>

<template>
  <form
    class="w-full max-w-2xl space-y-5"
    @submit.prevent="onSubmit"
  >
    <UFormField
      label="ID del curso en Moodle"
      description="Identificador numérico del curso en Moodle."
      size="md"
      :error="formFieldError(errors.moodleCourseId)"
    >
      <UInput
        v-model="moodleCourseId"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        size="md"
        class="w-full max-w-sm"
        :disabled="moodleIdDisabled || loading"
        placeholder="101"
      />
    </UFormField>
    <UFormField
      label="Nombre"
      description="Nombre que se mostrará en WayAcademyValidator."
      size="md"
      :error="formFieldError(errors.name)"
    >
      <UInput
        v-model="name"
        size="md"
        class="w-full"
        :disabled="loading"
        placeholder="Nombre del curso"
      />
    </UFormField>
    <UFormField
      label="Notas de configuración local"
      description="Información interna para los administradores. No será visible públicamente."
      size="md"
      :error="formFieldError(errors.notes)"
    >
      <UTextarea
        v-model="notes"
        size="md"
        class="w-full"
        :rows="5"
        :disabled="loading"
        placeholder="Opcional"
      />
    </UFormField>
    <UAlert
      v-if="!initial"
      color="info"
      variant="subtle"
      title="Publicación bajo tu control"
      description="El curso se guardará inicialmente como no publicado. Podrás revisar su información y publicarlo desde la página de detalle."
    />
    <UButton
      type="submit"
      size="md"
      :loading="loading"
      :disabled="loading"
    >
      {{ submitLabel || 'Guardar' }}
    </UButton>
  </form>
</template>
