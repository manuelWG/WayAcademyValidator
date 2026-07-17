<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'admin-auth'
})

const { login } = useAdminSession()
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  error.value = ''
  if (!username.value.trim() || !password.value) {
    error.value = 'Ingresa usuario y contraseña.'
    return
  }
  loading.value = true
  try {
    const result = await login(username.value, password.value)
    if (result.bootstrap) {
      error.value = 'No hay administradores configurados. Ejecuta npm run create-admin.'
      return
    }
    if (!result.authenticated) {
      error.value = 'Credenciales inválidas.'
      return
    }
    await navigateTo('/admin')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-md rounded-2xl border border-default bg-default p-6 shadow-sm sm:p-8 space-y-6">
    <div class="space-y-2 text-center">
      <h1 class="text-xl font-semibold text-highlighted">
        Acceso administrativo
      </h1>
      <p class="text-sm text-muted">
        Autenticación real con sesión segura. No hay registro público.
      </p>
    </div>

    <form
      class="space-y-4"
      @submit.prevent="onSubmit"
    >
      <UFormField
        label="Usuario"
        name="username"
      >
        <UInput
          v-model="username"
          autocomplete="username"
          :disabled="loading"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Contraseña"
        name="password"
      >
        <UInput
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          :disabled="loading"
          class="w-full"
        >
          <template #trailing>
            <UButton
              :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              color="neutral"
              variant="link"
              size="sm"
              type="button"
              :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              @click="showPassword = !showPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        :title="error"
      />

      <UButton
        type="submit"
        block
        size="lg"
        :loading="loading"
      >
        Iniciar sesión
      </UButton>
    </form>

    <p class="text-center text-sm">
      <NuxtLink
        to="/"
        class="text-muted hover:text-highlighted"
      >
        Volver a la consulta pública
      </NuxtLink>
    </p>
  </div>
</template>
