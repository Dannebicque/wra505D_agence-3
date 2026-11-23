<script setup lang="ts">
useSeoMeta({ title: ESPACE_LABELS.admin })
</script>

<template>
  <div>
    <h1 class="font-titre text-2xl text-highlighted sm:text-3xl">{{ ESPACE_LABELS.admin }}</h1>
    <!-- Chapeau des pages d'espace : 3 sous le titre, longueur de ligne de lecture -->
    <p class="mt-3 max-w-mesure text-muted">
      Les outils d’administration arrivent au fil des prochains sprints.
    </p>
  </div>
</template>
