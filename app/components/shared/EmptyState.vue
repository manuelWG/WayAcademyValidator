<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  icon?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-default px-6 py-12 text-center">
    <UIcon
      :name="icon || 'i-lucide-inbox'"
      class="size-10 text-muted"
    />
    <div class="space-y-1">
      <p class="font-medium text-highlighted">
        {{ title }}
      </p>
      <p
        v-if="description"
        class="max-w-md text-sm text-muted"
      >
        {{ description }}
      </p>
    </div>
    <slot />
  </div>
</template>
