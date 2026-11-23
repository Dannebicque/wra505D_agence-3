<!--
  En-tête de page des espaces (passe #32) : titre, phrase d'explication, actions.
  Ordre des actions, le même partout : les secondaires d'abord, l'action principale en dernier
  (à droite sur ordinateur, en bas sur téléphone, où le pouce l'atteint). Une seule action
  principale par écran (`UButton` plein, couleur par défaut), voir app.config.ts.

  <UiEnTetePage titre="Mes traces" chapeau="…">
    <template #actions>
      <UButton color="neutral" variant="outline">Secondaire</UButton>
      <UButton>Principale</UButton>
    </template>
  </UiEnTetePage>
-->
<script setup lang="ts">
defineProps<{
  titre: string
  /** Une phrase : ce que l'écran permet de faire, ou le fait du jour. */
  chapeau?: string
}>()
</script>

<template>
  <div>
    <!-- Fil d'Ariane ou lien de retour, au-dessus du titre -->
    <div v-if="$slots.avant" class="mb-4">
      <slot name="avant" />
    </div>
    <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div class="min-w-0 flex-1 basis-80">
        <h1 class="font-titre text-2xl break-words text-highlighted sm:text-3xl">
          <slot name="titre">{{ titre }}</slot>
        </h1>
        <p v-if="chapeau || $slots.chapeau" class="mt-2 max-w-mesure text-muted">
          <slot name="chapeau">{{ chapeau }}</slot>
        </p>
      </div>
      <div
        v-if="$slots.actions"
        class="flex w-full flex-wrap items-center gap-2 max-sm:*:flex-1 max-sm:*:justify-center sm:w-auto"
      >
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
