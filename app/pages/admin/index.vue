<script setup lang="ts">
useSeoMeta({ title: ESPACE_LABELS.admin })
</script>

<template>
  <div>
    <h1 class="font-titre text-2xl text-highlighted sm:text-3xl">{{ ESPACE_LABELS.admin }}</h1>
    <!-- Chapeau : 2 sous le titre, comme sur les autres pages d'espace ; longueur de ligne de lecture -->
    <p class="mt-2 max-w-mesure text-muted">
      Les outils d’administration arrivent au fil des prochains sprints.
    </p>
  </div>
</template>
