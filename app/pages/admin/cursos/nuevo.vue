<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const { create } = useCourses()
const loading = ref(false)
const toast = useToast()

async function onSubmit(payload: { moodleCourseId: number, name: string, notes: string }) {
  loading.value = true
  try {
    const course = await create(payload)
    toast.add({
      title: 'Curso registrado',
      description: 'El curso quedó no publicado.',
      color: 'success'
    })
    await navigateTo(`/admin/cursos/${course.id}`)
  } catch (error: unknown) {
    const status = error && typeof error === 'object' && 'statusCode' in error
      ? (error as { statusCode: number }).statusCode
      : undefined
    toast.add({
      title: status === 409 ? 'Ya existe un curso con ese Moodle ID' : 'No se pudo crear el curso',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <SharedPageHeader
      title="Registrar curso"
      description="Solo configuración local. No se publica automáticamente."
    />
    <AdminCourseForm
      submit-label="Crear curso"
      :loading="loading"
      @submit="onSubmit"
    />
  </div>
</template>
