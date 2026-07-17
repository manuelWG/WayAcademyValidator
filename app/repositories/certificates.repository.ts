import type { Certificate, CertificatePublicResult } from '../types/certificate'
import { normalizeCertificateCode } from '../utils/normalize-certificate-code'
import { normalizeDocument } from '../utils/normalize-document'
import { delay } from '../utils/delay'
import { useMockStore } from '../composables/useMockStore'

function getStore() {
  return useMockStore()
}

export const certificatesRepository = {
  async findByCode(code: string): Promise<CertificatePublicResult | null> {
    await delay()
    const normalized = normalizeCertificateCode(code)
    const store = getStore()
    const certificate = store.value.certificates.find(
      c => c.certificateCodeNormalized === normalized && c.publicVisible
    )
    if (!certificate) return null
    return {
      certificate,
      verifiedAt: new Date().toISOString()
    }
  },

  async findByDocument(document: string): Promise<CertificatePublicResult[]> {
    await delay()
    const normalized = normalizeDocument(document)
    const store = getStore()
    const verifiedAt = new Date().toISOString()
    return store.value.certificates
      .filter(c => c.publicVisible && c.snapshot.documentNumberNormalized === normalized)
      .map(certificate => ({ certificate, verifiedAt }))
  },

  async getByCode(code: string): Promise<CertificatePublicResult | null> {
    await delay(400)
    const normalized = normalizeCertificateCode(code)
    const store = getStore()
    const certificate = store.value.certificates.find(
      c => c.certificateCodeNormalized === normalized && c.publicVisible
    )
    if (!certificate) return null
    return {
      certificate,
      verifiedAt: new Date().toISOString()
    }
  },

  listByCourse(courseLocalId: string): Certificate[] {
    return getStore().value.certificates.filter(c => c.courseLocalId === courseLocalId)
  },

  listAll(): Certificate[] {
    return getStore().value.certificates
  }
}
