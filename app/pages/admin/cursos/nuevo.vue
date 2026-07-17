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
