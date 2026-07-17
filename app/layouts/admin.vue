<script setup lang="ts">
const { user, logout } = useAdminSession()
const open = ref(false)

function onLogout() {
  logout()
  navigateTo('/admin/login')
}
</script>

<template>
  <div class="min-h-dvh flex bg-muted/30">
    <aside class="hidden w-60 shrink-0 border-r border-default bg-default md:flex md:flex-col">
      <div class="flex h-16 items-center border-b border-default px-4">
        <SharedAppBrand
          size="sm"
          to="/admin"
        />
      </div>
      <AdminSidebar class="flex-1" />
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-default bg-default/90 px-4 backdrop-blur">
        <div class="flex items-center gap-2 md:hidden">
          <UButton
            icon="i-lucide-menu"
            color="neutral"
            variant="ghost"
            aria-label="Menú"
            @click="open = true"
          />
          <SharedAppBrand
            size="sm"
            to="/admin"
          />
        </div>
        <p class="hidden text-sm text-muted md:block">
          Panel administrativo
        </p>
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted">{{ user?.displayName }}</span>
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-lucide-log-out"
            @click="onLogout"
          >
            Salir
          </UButton>
        </div>
      </header>

      <main class="flex-1 p-4 sm:p-6">
        <slot />
      </main>
    </div>

    <USlideover v-model:open="open">
      <template #content>
        <div class="p-4 border-b border-default">
          <SharedAppBrand
            size="sm"
            to="/admin"
          />
        </div>
        <AdminSidebar @click="open = false" />
      </template>
    </USlideover>
  </div>
</template>
