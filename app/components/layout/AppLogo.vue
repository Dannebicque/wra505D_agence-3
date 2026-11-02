<script setup lang="ts">
defineProps<{ to: string }>()
</script>

<template>
  <NuxtLink
    :to="to"
    class="inline-flex items-center gap-2.5 rounded-md text-base font-semibold text-highlighted"
  >
    <svg width="22" height="22" viewBox="0 0 22 22" class="text-primary" aria-hidden="true">
      <rect x="2" y="5" width="12" height="15" rx="2" fill="currentColor" opacity="0.35" />
      <rect x="7" y="2" width="12" height="15" rx="2" fill="currentColor" />
    </svg>
    UniFolio
  </NuxtLink>
</template>
