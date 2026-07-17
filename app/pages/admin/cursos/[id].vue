<script setup lang="ts">
import {
  coursePublishFailedMessage,
  coursePublishSuccessMessage,
  courseUpdateFailedMessage,
  courseUpdatedMessage
} from '../../../utils/course-admin-messages'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const route = useRoute()
const { getById, update, setPublished } = useCourses()
const toast = useToast()

const courseId = computed(() => String(route.params.id))
const loading = ref(true)
const saving = ref(false)
const course = ref<Awaited<ReturnType<typeof getById>>>(null)

onMounted(async () => {
  course.value = await getById(courseId.value)
  loading.value = false
})

async function onSave(payload: { moodleCourseId: number, name: string, notes: string }) {
  if (saving.value) return
  saving.value = true
  try {
    course.value = await update(courseId.value, {
      name: payload.name,
      notes: payload.notes
    })
    toast.add(courseUpdatedMessage(course.value?.name ?? payload.name))
  } catch {
    toast.add(courseUpdateFailedMessage())
  } finally {
    saving.value = false
  }
}

async function togglePublish() {
  if (!course.value || saving.value) return
  const publishing = !course.value.isPublished
  const courseName = course.value.name
  saving.value = true
  try {
    course.value = await setPublished(courseId.value, publishing)
    toast.add(coursePublishSuccessMessage(
      course.value?.name ?? courseName,
      course.value?.isPublished ?? publishing
    ))
  } catch {
    toast.add(coursePublishFailedMessage(publishing))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <SharedLoadingBlock v-if="loading" />
    <SharedEmptyState
      v-else-if="!course"
      title="Curso no encontrado"
      description="El curso no existe o no tienes acceso."
    />
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
            :disabled="saving"
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
            Certificados importados
          </h2>
          <SharedEmptyState
            title="Sin certificados reales aún"
            description="Los certificados reales se conectarán en la fase de importación. La consulta pública y el wizard siguen usando datos de demostración."
          />
        </section>
      </div>
    </template>
  </div>
</template>
