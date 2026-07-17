<script setup lang="ts">
import type { ImportPreviewRow, ImportBatch, ImportCounters } from '../../types/import'

const { courses, list } = useCourses()
const { validateStructure, simulatePreview, confirmImport } = useImports()
const { user } = useAdminSession()
const toast = useToast()

const step = ref(1)
const courseLocalId = ref('')
const fileName = ref('')
const structureOk = ref(false)
const structureMessage = ref('')
const loading = ref(false)
const previewRows = ref<ImportPreviewRow[]>([])
const resultBatch = ref<ImportBatch | null>(null)
const coursesLoading = ref(true)

onMounted(async () => {
  try {
    await list()
  } finally {
    coursesLoading.value = false
  }
})

const selectedCourse = computed(() => courses.value.find(c => c.id === courseLocalId.value))

const counters = computed<ImportCounters>(() => ({
  total: previewRows.value.length,
  new: previewRows.value.filter(r => r.status === 'new').length,
  unchanged: previewRows.value.filter(r => r.status === 'unchanged').length,
  conflict: previewRows.value.filter(r => r.status === 'conflict').length,
  criticalConflict: previewRows.value.filter(r => r.status === 'critical_conflict').length,
  errors: previewRows.value.filter(r => r.status === 'error').length
}))

const courseOptions = computed(() =>
  courses.value.map(c => ({
    label: `${c.name} (Moodle #${c.moodleCourseId})`,
    value: c.id
  }))
)

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  fileName.value = file?.name || ''
}

async function goValidate() {
  if (!courseLocalId.value) {
    toast.add({ title: 'Selecciona un curso', color: 'error' })
    return
  }
  if (!fileName.value) {
    toast.add({ title: 'Selecciona un archivo CSV', color: 'error' })
    return
  }
  step.value = 3
  loading.value = true
  try {
    const result = await validateStructure(fileName.value)
    structureOk.value = result.ok
    structureMessage.value = result.message
  } finally {
    loading.value = false
  }
}

async function goPreview() {
  step.value = 4
  loading.value = true
  try {
    previewRows.value = await simulatePreview(courseLocalId.value, fileName.value)
  } finally {
    loading.value = false
  }
}

async function goConfirm() {
  step.value = 5
}

async function confirm() {
  loading.value = true
  try {
    resultBatch.value = await confirmImport({
      courseLocalId: courseLocalId.value,
      fileName: fileName.value,
      importedBy: user.value?.username || 'admin',
      rows: previewRows.value
    })
    step.value = 6
    toast.add({
      title: 'Importación simulada completada',
      description: 'Los cambios persisten en el store mock durante la navegación.',
      color: 'success'
    })
  } finally {
    loading.value = false
  }
}

function reset() {
  step.value = 1
  courseLocalId.value = ''
  fileName.value = ''
  structureOk.value = false
  structureMessage.value = ''
  previewRows.value = []
  resultBatch.value = null
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap gap-2">
      <UBadge
        v-for="n in 6"
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

    <!-- Step 1 -->
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
        title="Sin cursos reales"
        description="Registra un curso en Administración antes de importar (el preview sigue siendo demo)."
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

    <!-- Step 2 -->
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
          Selección simulada — el archivo no se procesa realmente
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          class="mx-auto block text-sm"
          @change="onFileChange"
        >
        <p
          v-if="fileName"
          class="text-sm font-medium text-highlighted"
        >
          {{ fileName }}
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
          :disabled="!fileName"
          @click="goValidate"
        >
          Continuar
        </UButton>
      </div>
    </div>

    <!-- Step 3 -->
    <div
      v-else-if="step === 3"
      class="space-y-4"
    >
      <h2 class="text-lg font-medium">
        3. Validar estructura
      </h2>
      <SharedLoadingBlock
        v-if="loading"
        label="Validando estructura…"
      />
      <template v-else>
        <UAlert
          :color="structureOk ? 'success' : 'error'"
          :title="structureOk ? 'Estructura válida' : 'Estructura inválida'"
          :description="structureMessage"
        />
        <div class="flex gap-2">
          <UButton
            variant="ghost"
            @click="step = 2"
          >
            Atrás
          </UButton>
          <UButton
            :disabled="!structureOk"
            @click="goPreview"
          >
            Continuar a previsualización
          </UButton>
        </div>
      </template>
    </div>

    <!-- Step 4 -->
    <div
      v-else-if="step === 4"
      class="space-y-4"
    >
      <h2 class="text-lg font-medium">
        4. Previsualizar resultados
      </h2>
      <SharedLoadingBlock
        v-if="loading"
        label="Clasificando filas…"
      />
      <template v-else>
        <AdminImportSummary :counters="counters" />
        <AdminImportPreviewTable :rows="previewRows" />
        <div class="flex gap-2">
          <UButton
            variant="ghost"
            @click="step = 3"
          >
            Atrás
          </UButton>
          <UButton @click="goConfirm">
            Continuar
          </UButton>
        </div>
      </template>
    </div>

    <!-- Step 5 -->
    <div
      v-else-if="step === 5"
      class="space-y-4 max-w-xl"
    >
      <h2 class="text-lg font-medium">
        5. Confirmar importación
      </h2>
      <p class="text-sm text-muted">
        Se importarán las filas nuevas. Las diferencias (conflictos y conflictos críticos) generarán auditoría
        sin modificar los snapshots publicados. Las filas de otro curso se excluyen (error).
      </p>
      <AdminImportSummary :counters="counters" />
      <div class="flex gap-2">
        <UButton
          variant="ghost"
          @click="step = 4"
        >
          Atrás
        </UButton>
        <UButton
          :loading="loading"
          @click="confirm"
        >
          Confirmar importación
        </UButton>
      </div>
    </div>

    <!-- Step 6 -->
    <div
      v-else-if="step === 6 && resultBatch"
      class="space-y-4"
    >
      <h2 class="text-lg font-medium">
        6. Resumen final
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
