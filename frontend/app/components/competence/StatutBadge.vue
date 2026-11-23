<script setup lang="ts">
// Statut d'une compétence (E-CP-04) : icône + texte + couleur, jamais la couleur seule.
import { COMPETENCE_STATUTS, type CompetenceStatut } from '~/demo/etudiant'

const props = defineProps<{ statut: CompetenceStatut }>()

const statut = computed(() => COMPETENCE_STATUTS[props.statut])
</script>

<template>
  <UBadge :color="statut.color" variant="subtle" :icon="statut.icon" class="shrink-0 rounded-full">
    {{ statut.label }}
  </UBadge>
</template>
