<script setup lang="ts">
import type { CertificatePublicResult } from '../../types/certificate'

defineProps<{
  result: CertificatePublicResult
}>()
</script>

<template>
  <div class="rounded-2xl border border-success/30 bg-success/5 p-6 space-y-5">
    <div class="flex items-start justify-between gap-3">
      <SharedStatusBadge
        status="valid"
        label="Certificado válido"
      />
      <UIcon
        name="i-lucide-badge-check"
        class="size-7 text-success"
      />
    </div>

    <dl class="grid gap-3 text-sm sm:grid-cols-2">
      <div>
        <dt class="text-muted">
          Código
        </dt>
        <dd class="font-mono font-medium text-highlighted">
          {{ result.certificate.certificateCode }}
        </dd>
      </div>
      <div>
        <dt class="text-muted">
          Participante
        </dt>
        <dd class="font-medium text-highlighted">
          {{ result.certificate.snapshot.participantName }}
        </dd>
      </div>
      <div>
        <dt class="text-muted">
          Documento
        </dt>
        <dd>
          <SharedMaskedDocument :value="result.certificate.snapshot.documentNumber" />
        </dd>
      </div>
      <div>
        <dt class="text-muted">
          Curso
        </dt>
        <dd class="font-medium text-highlighted">
          {{ result.certificate.snapshot.courseName }}
        </dd>
      </div>
      <div>
        <dt class="text-muted">
          Fecha de expedición
        </dt>
        <dd class="text-highlighted">
          {{ formatDate(result.certificate.snapshot.issuedAt) }}
        </dd>
      </div>
      <div>
        <dt class="text-muted">
          Consultado el
        </dt>
        <dd class="text-highlighted">
          {{ formatDateTime(result.verifiedAt) }}
        </dd>
      </div>
    </dl>

    <UButton
      :to="`/certificados/${encodeURIComponent(result.certificate.certificateCode)}`"
      icon="i-lucide-arrow-right"
      trailing
    >
      Ver detalle
    </UButton>
  </div>
</template>
