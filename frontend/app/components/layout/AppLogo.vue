<script setup lang="ts">
defineProps<{ to: string }>()
</script>

<template>
  <!-- min-w-0 et nom tronqué : sur un écran étroit (320 px, espacement du texte agrandi), le logo
       rétrécit au lieu de passer sous les outils voisins ; le nom reste lu en entier -->
  <NuxtLink
    :to="to"
    class="inline-flex min-w-0 items-center gap-2 rounded-md text-base font-semibold text-highlighted"
  >
    <!-- Deux pages superposées : celle de derrière en or, celle de devant en prune (couleurs de l'IUT) -->
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      class="shrink-0 text-primary"
      aria-hidden="true"
    >
      <rect x="2" y="5" width="12" height="15" rx="2" class="fill-or-400" />
      <rect x="7" y="2" width="12" height="15" rx="2" fill="currentColor" />
    </svg>
    <span class="truncate">UniFolio</span>
  </NuxtLink>
</template>
