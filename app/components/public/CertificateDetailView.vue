<script setup lang="ts">
import type { CertificatePublicResult } from '../../types/certificate'

defineProps<{
  result: CertificatePublicResult
}>()
</script>

<template>
  <article class="overflow-hidden rounded-2xl border border-default bg-default shadow-sm">
    <div class="border-b border-default bg-elevated/50 px-6 py-5 flex flex-wrap items-center justify-between gap-3">
      <SharedAppBrand size="sm" />
      <SharedStatusBadge
        status="valid"
        label="Certificado válido"
      />
    </div>

    <div class="px-6 py-8 space-y-8">
      <div class="space-y-2">
        <p class="text-sm text-muted uppercase tracking-wider">
          Código del certificado
        </p>
        <p class="font-mono text-xl font-semibold text-highlighted break-all">
          {{ result.certificate.certificateCode }}
        </p>
      </div>

      <dl class="grid gap-5 sm:grid-cols-2">
        <div class="space-y-1">
          <dt class="text-sm text-muted">
            Participante
          </dt>
          <dd class="text-lg font-medium text-highlighted">
            {{ result.certificate.snapshot.participantName }}
          </dd>
        </div>
        <div class="space-y-1">
          <dt class="text-sm text-muted">
            Documento
          </dt>
          <dd class="text-lg">
            <SharedMaskedDocument :value="result.certificate.snapshot.documentNumber" />
          </dd>
        </div>
        <div class="space-y-1 sm:col-span-2">
          <dt class="text-sm text-muted">
            Curso
          </dt>
          <dd class="text-lg font-medium text-highlighted">
            {{ result.certificate.snapshot.courseName }}
          </dd>
        </div>
        <div class="space-y-1">
          <dt class="text-sm text-muted">
            Fecha de expedición
          </dt>
          <dd class="text-highlighted">
            {{ formatDate(result.certificate.snapshot.issuedAt) }}
          </dd>
        </div>
        <div class="space-y-1">
          <dt class="text-sm text-muted">
            Registrado en WayAcademyValidator
          </dt>
          <dd class="text-highlighted">
            {{ formatDate(result.certificate.importedAt) }}
          </dd>
        </div>
        <div class="space-y-1 sm:col-span-2">
          <dt class="text-sm text-muted">
            Consultado el
          </dt>
          <dd class="text-highlighted">
            {{ formatDateTime(result.verifiedAt) }}
          </dd>
        </div>
      </dl>

      <UAlert
        color="neutral"
        variant="subtle"
        icon="i-lucide-info"
        title="Origen de la información"
        description="Esta información corresponde al registro importado desde la plataforma académica. No sustituye el certificado PDF original emitido por Moodle."
      />

      <UButton
        to="/"
        variant="outline"
        icon="i-lucide-rotate-ccw"
      >
        Realizar otra consulta
      </UButton>
    </div>
  </article>
</template>
