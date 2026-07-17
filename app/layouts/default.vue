<script setup lang="ts">
</script>

<template>
  <div class="min-h-dvh flex flex-col bg-default">
    <header class="border-b border-default/80 bg-default/80 backdrop-blur sticky top-0 z-40">
      <div class="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <SharedAppBrand />
        <UButton
          to="/admin/login"
          color="neutral"
          variant="ghost"
          size="sm"
        >
          Admin
        </UButton>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-default py-6">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 text-sm text-muted">
        WayAcademyValidator · Validación de certificados académicos
      </div>
    </footer>
  </div>
</template>
