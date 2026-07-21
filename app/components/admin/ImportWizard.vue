<script setup lang="ts">
import type { ImportBatch, ImportCounters } from '../../types/import'

const { courses, list } = useCourses()
const { upload, confirm, discard } = useImports()
const toast = useToast()

const step = ref(1)
const courseLocalId = ref('')
const selectedFile = ref<File | null>(null)
const loading = ref(false)
const previewBatch = ref<ImportBatch | null>(null)
const resultBatch = ref<ImportBatch | null>(null)
const coursesLoading = ref(true)
const fileInputKey = ref(0)

onMounted(async () => {
  try {
    await list()
  } finally {
    coursesLoading.value = false
  }
})

const selectedCourse = computed(() => courses.value.find(c => c.id === courseLocalId.value))
const previewRows = computed(() => previewBatch.value?.rows ?? [])
const emptyCounters: ImportCounters = {
  total: 0,
  new: 0,
  unchanged: 0,
  conflict: 0,
  criticalConflict: 0,
  errors: 0
}
const counters = computed(() => previewBatch.value?.counters ?? emptyCounters)

const courseOptions = computed(() =>
  courses.value.map(c => ({
    label: `${c.name} (Moodle #${c.moodleCourseId})`,
    value: c.id
  }))
)

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
}

async function createPreview() {
  if (!courseLocalId.value) {
    toast.add({ title: 'Selecciona un curso', color: 'error' })
    return
  }
  if (!selectedFile.value) {
    toast.add({ title: 'Selecciona un archivo CSV', color: 'error' })
    return
  }

  step.value = 3
  loading.value = true
  try {
    previewBatch.value = await upload(courseLocalId.value, selectedFile.value)
  } catch (error: unknown) {
    step.value = 2
    toast.add({
      title: 'No se pudo procesar el CSV',
      description: getErrorMessage(error),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

async function discardPreview() {
  if (!previewBatch.value || previewBatch.value.status !== 'paused') {
    step.value = 2
    return
  }

  loading.value = true
  try {
    await discard(previewBatch.value.id)
    previewBatch.value = null
    step.value = 2
  } catch (error: unknown) {
    toast.add({
      title: 'No se pudo descartar la previsualización',
      description: getErrorMessage(error),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

async function confirmImport() {
  if (!previewBatch.value) return

  loading.value = true
  try {
    resultBatch.value = await confirm(previewBatch.value.id)
    step.value = 5
    toast.add({
      title: 'Importación completada',
      description: 'El lote y sus conflictos de auditoría quedaron registrados.',
      color: 'success'
    })
  } catch (error: unknown) {
    toast.add({
      title: 'No se pudo confirmar la importación',
      description: getErrorMessage(error),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

function reset() {
  step.value = 1
  courseLocalId.value = ''
  selectedFile.value = null
  previewBatch.value = null
  resultBatch.value = null
  fileInputKey.value += 1
}

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Ocurrió un error inesperado.'
  if ('data' in error) {
    const data = (error as { data?: { message?: unknown } }).data
    if (typeof data?.message === 'string') return data.message
  }
  if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message
  }
  return 'Ocurrió un error inesperado.'
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap gap-2">
      <UBadge
        v-for="n in 5"
        :key="n"
        :color="step === n ? 'primary' : step > n ? 'success' : 'neutral'"
        :variant="step === n ? 'solid' : 'subtle'"
      >
        Paso {{ n }}
      </UBadge>
    </div>

    <UAlert
      color="warning"
      variant="subtle"
      icon="i-lucide-shield-alert"
      title="Sin actualización automática"
      description="Ninguna diferencia actualiza automáticamente el certificado publicado. Toda discrepancia genera auditoría y requiere decisión administrativa."
    />

    <div
      v-if="step === 1"
      class="space-y-4 max-w-lg"
    >
      <h2 class="text-lg font-medium">
        1. Seleccionar el curso
      </h2>
      <SharedLoadingBlock v-if="coursesLoading" />
      <SharedEmptyState
        v-else-if="!courseOptions.length"
        title="Sin cursos"
        description="Registra un curso en Administración antes de importar."
      />
      <template v-else>
        <USelect
          v-model="courseLocalId"
          :items="courseOptions"
          placeholder="Elige un curso"
          class="w-full"
        />
        <UButton
          :disabled="!courseLocalId"
          @click="step = 2"
        >
          Continuar
        </UButton>
      </template>
    </div>

    <div
      v-else-if="step === 2"
      class="space-y-4 max-w-lg"
    >
      <h2 class="text-lg font-medium">
        2. Seleccionar el archivo CSV
      </h2>
      <p class="text-sm text-muted">
        Curso: <strong>{{ selectedCourse?.name }}</strong> (Moodle #{{ selectedCourse?.moodleCourseId }})
      </p>
      <div class="rounded-xl border border-dashed border-default p-8 text-center space-y-3">
        <UIcon
          name="i-lucide-file-spreadsheet"
          class="size-8 text-muted mx-auto"
        />
        <p class="text-sm text-muted">
          El archivo se validará y clasificará en el servidor.
        </p>
        <input
          :key="fileInputKey"
          type="file"
          accept=".csv,text/csv"
          class="mx-auto block text-sm"
          @change="onFileChange"
        >
        <p
          v-if="selectedFile"
          class="text-sm font-medium text-highlighted"
        >
          {{ selectedFile.name }}
        </p>
      </div>
      <div class="flex gap-2">
        <UButton
          variant="ghost"
          @click="step = 1"
        >
          Atrás
        </UButton>
        <UButton
          :disabled="!selectedFile"
          @click="createPreview"
        >
          Procesar y previsualizar
        </UButton>
      </div>
    </div>

    <div
      v-else-if="step === 3"
      class="space-y-4"
    >
      <h2 class="text-lg font-medium">
        3. Previsualizar resultados
      </h2>
      <SharedLoadingBlock
        v-if="loading"
        label="Validando y clasificando filas…"
      />
      <template v-else-if="previewBatch">
        <AdminImportSummary :counters="counters" />
        <AdminImportPreviewTable :rows="previewRows" />
        <div class="flex gap-2">
          <UButton
            variant="ghost"
            :loading="loading"
            @click="discardPreview"
          >
            Descartar y volver
          </UButton>
          <UButton @click="step = 4">
            Continuar
          </UButton>
        </div>
      </template>
    </div>

    <div
      v-else-if="step === 4"
      class="space-y-4 max-w-xl"
    >
      <h2 class="text-lg font-medium">
        4. Confirmar importación
      </h2>
      <p class="text-sm text-muted">
        Se importarán las filas nuevas. Las diferencias generarán auditoría sin modificar los snapshots publicados.
        Las filas con errores se excluirán.
      </p>
      <AdminImportSummary :counters="counters" />
      <div class="flex gap-2">
        <UButton
          variant="ghost"
          @click="step = 3"
        >
          Atrás
        </UButton>
        <UButton
          :loading="loading"
          @click="confirmImport"
        >
          Confirmar importación
        </UButton>
      </div>
    </div>

    <div
      v-else-if="step === 5 && resultBatch"
      class="space-y-4"
    >
      <h2 class="text-lg font-medium">
        5. Resumen final
      </h2>
      <UAlert
        color="success"
        title="Importación registrada"
        :description="`ID ${resultBatch.id} · Hash ${resultBatch.fileHash}`"
      />
      <AdminImportSummary :counters="resultBatch.counters" />
      <div class="flex flex-wrap gap-2">
        <UButton :to="`/admin/importaciones/${resultBatch.id}`">
          Ver importación
        </UButton>
        <UButton
          to="/admin/auditoria"
          variant="soft"
        >
          Ver auditoría
        </UButton>
        <UButton
          variant="ghost"
          @click="reset"
        >
          Nueva importación
        </UButton>
      </div>
    </div>
  </div>
</template>
