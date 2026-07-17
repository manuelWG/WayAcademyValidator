export type CourseAdminToast = {
  title: string
  description: string
  color: 'success' | 'error'
}

export function courseCreatedMessage(name: string): CourseAdminToast {
  return {
    title: 'Curso creado correctamente',
    description: `El curso «${name}» fue registrado. Puedes revisar su información y publicarlo cuando esté listo.`,
    color: 'success'
  }
}

export function moodleCourseIdTakenMessage(moodleCourseId: number): CourseAdminToast {
  return {
    title: 'El Moodle ID ya está registrado',
    description: `Ya existe un curso con el Moodle ID ${moodleCourseId}. Utiliza otro identificador o revisa el curso existente.`,
    color: 'error'
  }
}

export function courseCreateFailedMessage(): CourseAdminToast {
  return {
    title: 'No se pudo registrar el curso',
    description: 'Ocurrió un problema al guardar la información. Verifica la conexión e inténtalo nuevamente.',
    color: 'error'
  }
}

export function courseUpdatedMessage(name: string): CourseAdminToast {
  return {
    title: 'Cambios guardados',
    description: `La configuración del curso «${name}» se actualizó correctamente.`,
    color: 'success'
  }
}

export function courseUpdateFailedMessage(): CourseAdminToast {
  return {
    title: 'No se guardaron los cambios',
    description: 'La información anterior se mantiene sin cambios. Inténtalo nuevamente.',
    color: 'error'
  }
}

export function coursePublishedMessage(name: string): CourseAdminToast {
  return {
    title: 'Curso publicado',
    description: `El curso «${name}» quedó marcado como disponible públicamente.`,
    color: 'success'
  }
}

export function courseUnpublishedMessage(name: string): CourseAdminToast {
  return {
    title: 'Curso retirado de la consulta pública',
    description: `El curso «${name}» dejó de estar disponible públicamente. Su información permanece guardada.`,
    color: 'success'
  }
}

export function coursePublishSuccessMessage(name: string, isPublished: boolean): CourseAdminToast {
  return isPublished
    ? coursePublishedMessage(name)
    : courseUnpublishedMessage(name)
}

/** `publishing` is the intended action (true = publish, false = unpublish). */
export function coursePublishFailedMessage(publishing: boolean): CourseAdminToast {
  return {
    title: publishing
      ? 'No se pudo publicar el curso'
      : 'No se pudo despublicar el curso',
    description: 'El estado anterior se mantiene sin cambios. Inténtalo nuevamente.',
    color: 'error'
  }
}
