<script setup lang="ts">
withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
  to?: string
}>(), {
  size: 'md'
})

const sizes = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl'
}
</script>

<template>
  <NuxtLink
    :to="to || '/'"
    class="inline-flex items-center gap-2 font-semibold tracking-tight text-highlighted no-underline"
    :class="sizes[size]"
  >
    <span
      class="inline-flex size-8 items-center justify-center rounded-md bg-primary text-inverted text-xs font-bold"
      :class="{ 'size-6 text-[10px]': size === 'sm', 'size-10 text-sm': size === 'lg' }"
    >
      WV
    </span>
    <span>WayAcademyValidator</span>
  </NuxtLink>
</template>
