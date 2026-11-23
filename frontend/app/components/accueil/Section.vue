<script setup lang="ts">
// Section de la page d'accueil : repère nommé par son titre, et la même colonne que la barre et le
// pied de page (marges extérieures égales à toutes les largeurs). L'espacement vertical est donné
// par la page (`class`).
defineProps<{
  /** Ancre de la section (liens de la barre). */
  id?: string
  /** Id du titre qui nomme la section. */
  titreId: string
}>()
</script>

<template>
  <section :id="id" :aria-labelledby="titreId">
    <div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-12">
      <slot />
    </div>
  </section>
</template>
