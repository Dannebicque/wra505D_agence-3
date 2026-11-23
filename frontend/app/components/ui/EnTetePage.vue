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
  /**
   * Élément partagé avec la carte ou la ligne d'où l'on vient (transition de vue) : même
   * `view-transition-name` des deux côtés.
   */
  transitionName?: string
}>()

/**
 * Titre, exposé pour y rendre le focus (après la suppression de l'élément qui l'avait, par
 * exemple) : il n'est focalisable que par programme (tabindex="-1"), hors de l'ordre de tabulation.
 */
const heading = useTemplateRef<HTMLHeadingElement>('heading')

defineExpose({ heading })
</script>

<template>
  <div>
    <!-- Fil d'Ariane ou lien de retour, au-dessus du titre -->
    <div v-if="$slots.avant" class="mb-4">
      <slot name="avant" />
    </div>
    <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div class="min-w-0 flex-1 basis-80">
        <h1
          ref="heading"
          tabindex="-1"
          class="font-titre text-2xl break-words text-highlighted focus:outline-none sm:text-3xl"
          :style="transitionName ? { viewTransitionName: transitionName } : undefined"
        >
          <slot name="titre">{{ titre }}</slot>
        </h1>
        <p v-if="chapeau || $slots.chapeau" class="mt-2 max-w-mesure text-muted">
          <slot name="chapeau">{{ chapeau }}</slot>
        </p>
      </div>
      <!--
        Sous `sm`, les actions s'empilent sur toute la largeur, la principale (la dernière) en bas,
        sous le pouce
      -->
      <div
        v-if="$slots.actions"
        class="flex w-full flex-col items-stretch gap-2 max-sm:*:justify-center sm:w-auto sm:flex-row sm:flex-wrap sm:items-center"
      >
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
