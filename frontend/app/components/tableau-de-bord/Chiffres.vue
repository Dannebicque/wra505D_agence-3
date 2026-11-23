<script setup lang="ts">
// Chiffres secondaires d'un tableau de bord : une liste sans surface (libellé à gauche, valeur à
// droite), pour qu'ils restent en retrait de l'indicateur principal et du graphique.
defineProps<{
  figures: { label: string; value: number; suffix?: string }[]
  /** Titre de la section (nom de la région). */
  title: string
}>()

const titleId = useId()
</script>

<template>
  <section :aria-labelledby="titleId">
    <h2 :id="titleId" class="text-sm font-semibold text-highlighted">{{ title }}</h2>
    <dl class="mt-2 divide-y divide-default">
      <div
        v-for="figure in figures"
        :key="figure.label"
        class="flex flex-wrap items-baseline justify-between gap-x-4 py-3"
      >
        <dt class="text-sm text-muted">{{ figure.label }}</dt>
        <!-- Valeurs en colonne : chiffres tabulaires -->
        <dd class="text-2xl text-highlighted tabular-nums">
          {{ figure.value }}
          <span v-if="figure.suffix" class="text-sm text-muted">{{ figure.suffix }}</span>
        </dd>
      </div>
    </dl>
  </section>
</template>
