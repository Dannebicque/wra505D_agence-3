<script setup lang="ts">
// Statut d'évaluation d'une trace : « À évaluer » ou « Évaluée » (texte et icône, pas seulement la
// couleur). Icônes des états « en attente » et « acquis » de la table `ETATS`.
import { ETATS } from '~/demo/base'

defineProps<{ enAttente: boolean }>()
</script>

<template>
  <UBadge
    v-if="enAttente"
    color="warning"
    variant="subtle"
    :icon="ETATS[0].icon"
    class="rounded-full"
    label="À évaluer"
  />
  <UBadge
    v-else
    color="success"
    variant="subtle"
    :icon="ETATS[3].icon"
    class="rounded-full"
    label="Évaluée"
  />
</template>
