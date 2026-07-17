import { certificatesRepository } from '../repositories/certificates.repository'

export function useCertificates() {
  return {
    findByCode: certificatesRepository.findByCode,
    findByDocument: certificatesRepository.findByDocument,
    getByCode: certificatesRepository.getByCode,
    listByCourse: certificatesRepository.listByCourse,
    listAll: certificatesRepository.listAll
  }
}
