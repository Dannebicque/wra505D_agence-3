<script setup lang="ts">
// Statut d'évaluation d'une trace : « À évaluer » ou « Évaluée » (texte et icône, pas seulement la couleur).
defineProps<{ enAttente: boolean }>()
</script>

<template>
  <UBadge
    v-if="enAttente"
    color="warning"
    variant="subtle"
    icon="i-lucide-clock"
    class="rounded-full"
    label="À évaluer"
  />
  <UBadge
    v-else
    color="success"
    variant="subtle"
    icon="i-lucide-circle-check"
    class="rounded-full"
    label="Évaluée"
  />
</template>
