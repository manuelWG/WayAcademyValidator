import { describe, expect, it } from 'vitest'
import {
  classifyChangedFields,
  classifyDocumentChange,
  classifyMoodleIdChange,
  classifyNameChange
} from '../../app/utils/classify-identity-change'

describe('classify-identity-change', () => {
  it('marks name changes as critical', () => {
    expect(classifyNameChange('Ana', 'Ana Lucía')).toBe(true)
    expect(classifyChangedFields(['participantName']).riskLevel).toBe('critical')
  })

  it('marks document changes as critical', () => {
    expect(classifyDocumentChange('52334891', '52334892')).toBe(true)
    expect(classifyChangedFields(['documentNumber']).riskLevel).toBe('critical')
  })

  it('marks Moodle id changes as critical', () => {
    expect(classifyMoodleIdChange('userId', 1, 2)).toBe(true)
    expect(classifyMoodleIdChange('certificateIssueId', 10, 11)).toBe(true)
    expect(classifyChangedFields(['userId', 'certificateIssueId']).riskLevel).toBe('critical')
  })

  it('keeps non-identity fields as medium', () => {
    expect(classifyChangedFields(['courseName']).riskLevel).toBe('medium')
  })
})
