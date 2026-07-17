<script setup lang="ts">
const items = [
  { label: 'Dashboard', to: '/admin', icon: 'i-lucide-layout-dashboard', exact: true },
  { label: 'Cursos', to: '/admin/cursos', icon: 'i-lucide-graduation-cap' },
  { label: 'Importaciones', to: '/admin/importaciones', icon: 'i-lucide-file-up' },
  { label: 'Auditoría', to: '/admin/auditoria', icon: 'i-lucide-shield-alert' }
]

const route = useRoute()

function isActive(item: { to: string, exact?: boolean }) {
  if (item.exact) return route.path === item.to
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}
</script>

<template>
  <nav class="flex flex-col gap-1 p-3">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
      :class="isActive(item)
        ? 'bg-primary/10 text-primary font-medium'
        : 'text-muted hover:bg-elevated hover:text-highlighted'"
    >
      <UIcon
        :name="item.icon"
        class="size-4"
      />
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>
