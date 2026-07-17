import { describe, expect, it } from 'vitest'
import {
  courseCreateFailedMessage,
  courseCreatedMessage,
  coursePublishFailedMessage,
  coursePublishSuccessMessage,
  coursePublishedMessage,
  courseUnpublishedMessage,
  courseUpdateFailedMessage,
  courseUpdatedMessage,
  moodleCourseIdTakenMessage
} from '../../app/utils/course-admin-messages'

describe('course admin messages', () => {
  it('builds create success message', () => {
    expect(courseCreatedMessage('Liderazgo')).toEqual({
      title: 'Curso creado correctamente',
      description: 'El curso «Liderazgo» fue registrado. Puedes revisar su información y publicarlo cuando esté listo.',
      color: 'success'
    })
  })

  it('builds duplicate Moodle ID message', () => {
    expect(moodleCourseIdTakenMessage(101)).toEqual({
      title: 'El Moodle ID ya está registrado',
      description: 'Ya existe un curso con el Moodle ID 101. Utiliza otro identificador o revisa el curso existente.',
      color: 'error'
    })
  })

  it('builds generic create failure message without internal details', () => {
    const message = courseCreateFailedMessage()
    expect(message).toEqual({
      title: 'No se pudo registrar el curso',
      description: 'Ocurrió un problema al guardar la información. Verifica la conexión e inténtalo nuevamente.',
      color: 'error'
    })
    expect(message.description).not.toMatch(/postgres|drizzle|neon/i)
  })

  it('builds update success and failure messages', () => {
    expect(courseUpdatedMessage('Finanzas')).toEqual({
      title: 'Cambios guardados',
      description: 'La configuración del curso «Finanzas» se actualizó correctamente.',
      color: 'success'
    })
    expect(courseUpdateFailedMessage()).toEqual({
      title: 'No se guardaron los cambios',
      description: 'La información anterior se mantiene sin cambios. Inténtalo nuevamente.',
      color: 'error'
    })
  })

  it('builds publish and unpublish success messages', () => {
    expect(coursePublishedMessage('Liderazgo')).toEqual({
      title: 'Curso publicado',
      description: 'El curso «Liderazgo» quedó marcado como disponible públicamente.',
      color: 'success'
    })
    expect(courseUnpublishedMessage('Liderazgo')).toEqual({
      title: 'Curso retirado de la consulta pública',
      description: 'El curso «Liderazgo» dejó de estar disponible públicamente. Su información permanece guardada.',
      color: 'success'
    })
    expect(coursePublishSuccessMessage('A', true).title).toBe('Curso publicado')
    expect(coursePublishSuccessMessage('A', false).title).toBe('Curso retirado de la consulta pública')
  })

  it('builds publish failure messages that preserve prior state', () => {
    expect(coursePublishFailedMessage(true)).toEqual({
      title: 'No se pudo publicar el curso',
      description: 'El estado anterior se mantiene sin cambios. Inténtalo nuevamente.',
      color: 'error'
    })
    expect(coursePublishFailedMessage(false)).toEqual({
      title: 'No se pudo despublicar el curso',
      description: 'El estado anterior se mantiene sin cambios. Inténtalo nuevamente.',
      color: 'error'
    })
  })
})
