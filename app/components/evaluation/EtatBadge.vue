<script setup lang="ts">
import type { ValidationEtat } from '#shared/types/evaluation'
import { ETATS } from '~/demo/base'

// Niveau d'acquisition d'une compétence : texte et icône, la couleur n'est qu'un renfort.
defineProps<{ etat: ValidationEtat }>()

const ICONES: Record<ValidationEtat, string> = {
  0: 'i-lucide-clock',
  1: 'i-lucide-circle-x',
  2: 'i-lucide-circle-dashed',
  3: 'i-lucide-circle-check',
}
</script>

<template>
  <UBadge
    :color="ETATS[etat].color"
    variant="subtle"
    :icon="ICONES[etat]"
    class="rounded-full"
    :label="ETATS[etat].label"
  />
</template>
