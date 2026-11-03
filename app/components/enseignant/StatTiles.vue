<script setup lang="ts">
// Tuiles de chiffres clés, du même modèle que le tableau de bord étudiant.
defineProps<{
  tiles: { label: string; value: number; suffix?: string }[]
  /** Titre (masqué) de la section, pour les lecteurs d'écran. */
  title: string
}>()

const titleId = useId()
</script>

<template>
  <section :aria-labelledby="titleId">
    <h2 :id="titleId" class="sr-only">{{ title }}</h2>
    <dl class="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <div
        v-for="tile in tiles"
        :key="tile.label"
        class="flex min-h-24 flex-col justify-between gap-3 rounded-panneau bg-muted p-4 lg:min-h-28 lg:p-5"
      >
        <dt class="text-sm text-muted">{{ tile.label }}</dt>
        <dd class="text-3xl text-highlighted">
          {{ tile.value }}
          <span v-if="tile.suffix" class="text-base text-muted">{{ tile.suffix }}</span>
        </dd>
      </div>
    </dl>
  </section>
</template>
