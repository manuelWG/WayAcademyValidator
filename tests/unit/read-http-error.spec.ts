import { describe, expect, it } from 'vitest'
import {
  isMoodleCourseIdTakenError,
  readHttpError
} from '../../app/utils/read-http-error'

describe('readHttpError', () => {
  it('reads statusCode and data.code', () => {
    expect(readHttpError({
      statusCode: 409,
      data: { code: 'MOODLE_COURSE_ID_TAKEN' }
    })).toEqual({
      statusCode: 409,
      code: 'MOODLE_COURSE_ID_TAKEN'
    })
  })

  it('reads status and nested data.data.code', () => {
    expect(readHttpError({
      status: 409,
      data: { data: { code: 'MOODLE_COURSE_ID_TAKEN' } }
    })).toEqual({
      statusCode: 409,
      code: 'MOODLE_COURSE_ID_TAKEN'
    })
  })

  it('reads response.status and response._data.code', () => {
    expect(readHttpError({
      response: {
        status: 500,
        _data: { code: 'OTHER' }
      }
    })).toEqual({
      statusCode: 500,
      code: 'OTHER'
    })
  })

  it('reads response._data.data.code', () => {
    expect(readHttpError({
      response: {
        status: 409,
        _data: { data: { code: 'MOODLE_COURSE_ID_TAKEN' } }
      }
    })).toEqual({
      statusCode: 409,
      code: 'MOODLE_COURSE_ID_TAKEN'
    })
  })

  it('returns empty info for unknown shapes', () => {
    expect(readHttpError(null)).toEqual({})
    expect(readHttpError('boom')).toEqual({})
    expect(readHttpError({})).toEqual({})
  })
})

describe('isMoodleCourseIdTakenError', () => {
  it('prefers the stable MOODLE_COURSE_ID_TAKEN code', () => {
    expect(isMoodleCourseIdTakenError({
      statusCode: 500,
      data: { code: 'MOODLE_COURSE_ID_TAKEN' }
    })).toBe(true)
  })

  it('falls back to HTTP 409', () => {
    expect(isMoodleCourseIdTakenError({ statusCode: 409 })).toBe(true)
    expect(isMoodleCourseIdTakenError({ status: 409 })).toBe(true)
  })

  it('does not treat other errors as taken', () => {
    expect(isMoodleCourseIdTakenError({
      statusCode: 500,
      data: { code: 'OTHER' }
    })).toBe(false)
    expect(isMoodleCourseIdTakenError({ statusCode: 400 })).toBe(false)
  })
})
