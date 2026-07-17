<script setup lang="ts">
import type { Certificate } from '../../types/certificate'

defineProps<{
  certificate: Certificate
}>()
</script>

<template>
  <div class="flex flex-col gap-3 rounded-xl border border-default p-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="space-y-1 min-w-0">
      <p class="font-medium text-highlighted truncate">
        {{ certificate.snapshot.courseName }}
      </p>
      <p class="text-sm text-muted">
        Expedido el {{ formatDate(certificate.snapshot.issuedAt) }}
      </p>
      <p class="font-mono text-xs text-muted">
        {{ certificate.certificateCode }}
      </p>
    </div>
    <UButton
      :to="`/certificados/${encodeURIComponent(certificate.certificateCode)}`"
      variant="soft"
      size="sm"
    >
      Ver certificado
    </UButton>
  </div>
</template>
