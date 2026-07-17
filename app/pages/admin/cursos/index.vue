<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const { courses, setPublished } = useCourses()
const toast = useToast()
const loadingId = ref<string | null>(null)

async function togglePublish(id: string, next: boolean) {
  loadingId.value = id
  try {
    await setPublished(id, next)
    toast.add({
      title: next ? 'Curso publicado' : 'Curso despublicado',
      color: 'success'
    })
  } finally {
    loadingId.value = null
  }
}
</script>

<template>
  <div>
    <SharedPageHeader
      title="Cursos"
      description="Configuración local de cursos habilitados para validación pública"
    >
      <template #actions>
        <UButton
          to="/admin/cursos/nuevo"
          icon="i-lucide-plus"
        >
          Registrar curso
        </UButton>
      </template>
    </SharedPageHeader>

    <div class="overflow-x-auto rounded-xl border border-default">
      <table class="w-full min-w-[800px] text-left text-sm">
        <thead class="bg-elevated/60 text-muted">
          <tr>
            <th class="px-4 py-3 font-medium">
              Moodle ID
            </th>
            <th class="px-4 py-3 font-medium">
              Nombre
            </th>
            <th class="px-4 py-3 font-medium">
              Certificados
            </th>
            <th class="px-4 py-3 font-medium">
              Estado
            </th>
            <th class="px-4 py-3 font-medium">
              Última importación
            </th>
            <th class="px-4 py-3 font-medium">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="course in courses"
            :key="course.id"
            class="border-t border-default"
          >
            <td class="px-4 py-3 font-mono">
              {{ course.moodleCourseId }}
            </td>
            <td class="px-4 py-3 font-medium text-highlighted">
              {{ course.name }}
            </td>
            <td class="px-4 py-3">
              {{ course.certificatesCount }}
            </td>
            <td class="px-4 py-3">
              <AdminCourseStatusBadge :published="course.isPublished" />
            </td>
            <td class="px-4 py-3 text-muted">
              {{ formatDate(course.lastImportAt) }}
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                <UButton
                  :to="`/admin/cursos/${course.id}`"
                  size="xs"
                  variant="ghost"
                >
                  Ver
                </UButton>
                <UButton
                  size="xs"
                  variant="soft"
                  :loading="loadingId === course.id"
                  @click="togglePublish(course.id, !course.isPublished)"
                >
                  {{ course.isPublished ? 'Despublicar' : 'Publicar' }}
                </UButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
