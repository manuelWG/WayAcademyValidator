<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const { dashboardStats } = useAdminSession()
const { list, publishedCount } = useCourses()
const { imports, list: listImports } = useImports()
const { pending, list: listAudit } = useAudit()

const loadingDashboard = ref(true)

onMounted(async () => {
  try {
    await Promise.all([list(), listImports(), listAudit()])
  } finally {
    loadingDashboard.value = false
  }
})

const recent = computed(() => imports.value.slice(0, 5))
const pendingPreview = computed(() => pending.value.slice(0, 4))
</script>

<template>
  <div>
    <SharedPageHeader
      title="Dashboard"
      description="Resumen operativo de WayAcademyValidator"
    >
      <template #actions>
        <UButton
          to="/admin/cursos/nuevo"
          variant="soft"
          icon="i-lucide-plus"
        >
          Crear curso
        </UButton>
        <UButton
          to="/admin/importaciones/nueva"
          icon="i-lucide-file-up"
        >
          Importar certificados
        </UButton>
      </template>
    </SharedPageHeader>

    <UAlert
      class="mb-6"
      color="warning"
      variant="subtle"
      title="Datos parcialmente reales"
      description="Cursos, importaciones y auditoría usan Neon. La consulta pública y sus métricas de certificados permanecen en modo demostración."
    />

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 mb-8">
      <AdminStatCard
        label="Cursos habilitados"
        :value="loadingDashboard ? '…' : publishedCount"
        icon="i-lucide-graduation-cap"
        source="real"
      />
      <AdminStatCard
        label="Certificados importados"
        :value="dashboardStats.importedCertificates"
        icon="i-lucide-award"
        source="demo"
      />
      <AdminStatCard
        label="Participantes con certificados"
        :value="dashboardStats.participantsWithCertificates"
        icon="i-lucide-users"
        source="demo"
      />
      <AdminStatCard
        label="Última importación"
        :value="loadingDashboard ? '…' : formatDate(dashboardStats.lastImportAt)"
        icon="i-lucide-clock"
        source="real"
      />
      <AdminStatCard
        label="Conflictos pendientes"
        :value="loadingDashboard ? '…' : dashboardStats.pendingConflicts"
        icon="i-lucide-shield-alert"
        source="real"
        :hint="dashboardStats.pendingConflicts ? 'Requieren decisión administrativa' : undefined"
      />
    </div>

    <div class="grid gap-8 lg:grid-cols-2">
      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-medium text-highlighted">
            Importaciones recientes
          </h2>
          <UButton
            to="/admin/importaciones"
            variant="link"
            size="sm"
          >
            Ver todas
          </UButton>
        </div>
        <AdminRecentImportsTable
          v-if="recent.length"
          :imports="recent"
        />
        <SharedEmptyState
          v-else
          title="Sin importaciones"
        />
      </section>

      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-medium text-highlighted">
            Conflictos detectados
          </h2>
          <UButton
            to="/admin/auditoria"
            variant="link"
            size="sm"
          >
            Ver auditoría
          </UButton>
        </div>
        <AdminConflictsPreview
          v-if="pendingPreview.length"
          :conflicts="pendingPreview"
        />
        <SharedEmptyState
          v-else
          title="Sin conflictos pendientes"
          icon="i-lucide-check-circle"
        />
      </section>
    </div>
  </div>
</template>
