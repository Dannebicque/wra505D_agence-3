<script setup lang="ts">
// Bannière par défaut : un aplat sarcelle, purement décoratif (masqué aux lecteurs d'écran).
// Pas de dégradé ni de formes décoratives (style éditorial : des aplats francs). Quand l'étudiant
// aura déposé une image, elle la remplacera ; la bannière restera décorative (`alt=""`), le titre
// du portfolio étant écrit juste en dessous.
withDefaults(defineProps<{ size?: 'sm' | 'lg' }>(), { size: 'lg' })
</script>

<template>
  <div
    aria-hidden="true"
    class="rounded-panneau bg-(--ui-color-primary-700) dark:bg-(--ui-color-primary-800)"
    :class="size === 'lg' ? 'h-32 sm:h-44 lg:h-52' : 'h-16'"
  />
</template>
