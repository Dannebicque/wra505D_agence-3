<!--
  Cloche des notifications de l'espace étudiant : mène aux retours, avec le nombre de non-lus.
  Maquette : le nombre vient des retours de démonstration.
-->
<script setup lang="ts">
import { RETOURS } from '~/demo/base'

const unreadCount = RETOURS.filter((retour) => !retour.lu).length

const label =
  unreadCount === 0
    ? 'Notifications, aucune non lue'
    : `Notifications, ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
</script>

<template>
  <UButton
    to="/etudiant/retours"
    icon="i-lucide-bell"
    color="neutral"
    variant="ghost"
    :aria-label="label"
    class="relative pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:justify-center"
  >
    <!--
      Bouton icône, mais la pastille occupe son contenu : Nuxt UI ne lui applique pas la variante
      `square` du thème. Même zone tactile (44 × 44 px sur écran tactile), posée ici.
    -->
    <!--
      Pastille : seul emploi de l'or hors du socle, sous un texte prune 950 (9,6:1). Le nombre est
      dans le nom du lien ; la pastille, masquée aux lecteurs d'écran, ne fait que le montrer.
      Chiffres de même largeur, centrés sur la hauteur des capitales (centre-optique).
    -->
    <span
      v-if="unreadCount > 0"
      aria-hidden="true"
      class="absolute top-0 right-0 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-or-400 px-1 text-xs font-semibold text-prune-950 tabular-nums"
    >
      <span class="centre-optique">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </span>
  </UButton>
</template>
