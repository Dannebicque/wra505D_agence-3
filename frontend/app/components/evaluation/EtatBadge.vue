<script setup lang="ts">
import type { ValidationEtat } from '#shared/types/evaluation'
import { ETATS } from '~/demo/base'

// Niveau d'acquisition d'une compétence : texte et icône, la couleur n'est qu'un renfort.
defineProps<{ etat: ValidationEtat }>()
</script>

<template>
  <UBadge
    :color="ETATS[etat].color"
    variant="subtle"
    :icon="ETATS[etat].icon"
    class="rounded-full"
    :label="ETATS[etat].label"
  />
</template>
