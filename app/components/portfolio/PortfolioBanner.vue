<script setup lang="ts">
// Bannière de démonstration : un aplat dégradé des jetons sarcelle, purement décoratif (masqué
// aux lecteurs d'écran). Quand l'étudiant aura déposé une image, elle la remplacera ; la
// bannière restera décorative (`alt=""`), le titre du portfolio étant écrit juste en dessous.
withDefaults(defineProps<{ size?: 'sm' | 'lg' }>(), { size: 'lg' })
</script>

<template>
  <div
    aria-hidden="true"
    class="relative overflow-hidden rounded-panneau bg-linear-to-br from-sarcelle-600 via-sarcelle-800 to-sarcelle-950"
    :class="size === 'lg' ? 'h-32 sm:h-44 lg:h-52' : 'h-16'"
  >
    <div class="absolute -top-1/2 -right-1/4 aspect-square w-2/3 rounded-full bg-sarcelle-400/25" />
    <div
      class="absolute -bottom-2/3 left-1/5 aspect-square w-1/2 rounded-full bg-sarcelle-200/15"
    />
  </div>
</template>
