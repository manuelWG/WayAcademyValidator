<script setup lang="ts">
import {
  courseCreateFailedMessage,
  courseCreatedMessage,
  moodleCourseIdTakenMessage
} from '../../../utils/course-admin-messages'
import { isMoodleCourseIdTakenError } from '../../../utils/read-http-error'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const { create } = useCourses()
const loading = ref(false)
const toast = useToast()

async function onSubmit(payload: { moodleCourseId: number, name: string, notes: string }) {
  if (loading.value) return
  loading.value = true
  try {
    const course = await create(payload)
    toast.add(courseCreatedMessage(course.name))
    await navigateTo(`/admin/cursos/${course.id}`)
  } catch (error: unknown) {
    if (isMoodleCourseIdTakenError(error)) {
      toast.add(moodleCourseIdTakenMessage(payload.moodleCourseId))
    } else {
      toast.add(courseCreateFailedMessage())
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <SharedPageHeader
      title="Registrar curso"
      description="Registra la información básica del curso y decide cuándo estará disponible públicamente."
    />
    <AdminCourseForm
      submit-label="Crear curso"
      :loading="loading"
      @submit="onSubmit"
    />
  </div>
</template>
