<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const route = useRoute()
const { getById, update, setPublished } = useCourses()
const { listByCourse } = useCertificates()
const toast = useToast()

const courseId = computed(() => String(route.params.id))
const loading = ref(true)
const saving = ref(false)
const course = ref<Awaited<ReturnType<typeof getById>>>(null)

const certificates = computed(() => listByCourse(courseId.value))

onMounted(async () => {
  course.value = await getById(courseId.value)
  loading.value = false
})

async function onSave(payload: { moodleCourseId: number, name: string, notes: string }) {
  saving.value = true
  try {
    course.value = await update(courseId.value, payload)
    toast.add({ title: 'Curso actualizado', color: 'success' })
  } finally {
    saving.value = false
  }
}

async function togglePublish() {
  if (!course.value) return
  saving.value = true
  try {
    course.value = await setPublished(courseId.value, !course.value.isPublished)
    toast.add({
      title: course.value?.isPublished ? 'Curso publicado' : 'Curso despublicado',
      color: 'success'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <SharedLoadingBlock v-if="loading || !course" />
    <template v-else>
      <SharedPageHeader
        :title="course.name"
        :description="`Moodle ID ${course.moodleCourseId}`"
      >
        <template #actions>
          <AdminCourseStatusBadge :published="course.isPublished" />
          <UButton
            variant="soft"
            :loading="saving"
            @click="togglePublish"
          >
            {{ course.isPublished ? 'Despublicar' : 'Publicar' }}
          </UButton>
          <UButton
            to="/admin/importaciones/nueva"
            icon="i-lucide-file-up"
          >
            Importar
          </UButton>
        </template>
      </SharedPageHeader>

      <div class="grid gap-8 lg:grid-cols-2">
        <section class="space-y-4">
          <h2 class="font-medium text-highlighted">
            Configuración local
          </h2>
          <AdminCourseForm
            :initial="{
              moodleCourseId: course.moodleCourseId,
              name: course.name,
              notes: course.notes
            }"
            submit-label="Guardar cambios"
            :loading="saving"
            @submit="onSave"
          />
        </section>

        <section class="space-y-4">
          <h2 class="font-medium text-highlighted">
            Certificados importados ({{ certificates.length }})
          </h2>
          <SharedEmptyState
            v-if="!certificates.length"
            title="Sin certificados"
            description="Importa un CSV para este curso."
          />
          <div
            v-else
            class="space-y-2"
          >
            <div
              v-for="cert in certificates"
              :key="cert.id"
              class="rounded-lg border border-default p-3 text-sm"
            >
              <p class="font-mono font-medium">
                {{ cert.certificateCode }}
              </p>
              <p>{{ cert.snapshot.participantName }}</p>
              <p class="text-muted">
                Expedido {{ formatDate(cert.snapshot.issuedAt) }} ·
                Importado {{ formatDate(cert.importedAt) }}
              </p>
            </div>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
