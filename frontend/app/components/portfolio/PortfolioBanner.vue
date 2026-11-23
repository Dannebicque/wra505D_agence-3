<script setup lang="ts">
// Bannière par défaut : purement décorative (masquée aux lecteurs d'écran). Couleurs de l'IUT en
// accent seulement (#24) : un aplat prune très clair, presque neutre, et un trait or, seul détail.
// Aucun texte n'est posé dessus (le titre du portfolio est écrit juste en dessous). Quand
// l'étudiant aura déposé une image, elle la remplacera, décorative elle aussi (`alt=""`).
withDefaults(defineProps<{ size?: 'sm' | 'lg' }>(), { size: 'lg' })
</script>

<template>
  <div
    aria-hidden="true"
    class="relative rounded-panneau border border-default bg-(--ui-color-primary-50) dark:bg-(--ui-color-primary-900)/40"
    :class="size === 'lg' ? 'h-32 sm:h-44 lg:h-52' : 'h-16'"
  >
    <span
      class="absolute h-1 rounded-full bg-or-400"
      :class="size === 'lg' ? 'bottom-6 left-6 w-12 sm:bottom-8 sm:left-8' : 'bottom-4 left-4 w-8'"
    />
  </div>
</template>
