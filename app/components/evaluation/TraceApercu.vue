<script setup lang="ts">
import type { TraceType } from '#shared/types/trace'

// Aperçu FACTICE de la pièce jointe d'une trace, selon son type (maquette : aucun fichier chargé,
// aucune ressource externe). Les boutons sont visibles mais sans effet tant que la page n'est pas branchée.
defineProps<{
  type: TraceType
  /** Nom du fichier (image, PDF) ou adresse (lien, vidéo). */
  contenu: string
  legende: string | null
  taille: string | null
}>()
</script>

<template>
  <!-- Image : aplat à la place du fichier ; la légende sert de texte alternatif -->
  <figure v-if="type === 'image'" class="space-y-2">
    <div
      role="img"
      :aria-label="legende ?? 'Image sans légende'"
      class="flex aspect-4/3 items-center justify-center rounded-panneau bg-elevated text-muted"
    >
      <UIcon name="i-lucide-image" class="size-10" />
    </div>
    <figcaption class="text-sm text-muted">
      <span class="font-medium text-default">{{ contenu }}</span>
      <template v-if="taille"> · {{ taille }}</template>
      <span v-if="legende" class="mt-1 block">Légende : {{ legende }}</span>
      <span v-else class="mt-1 block">Aucune légende fournie par l’étudiant.</span>
    </figcaption>
  </figure>

  <!-- PDF : carte fichier -->
  <div
    v-else-if="type === 'pdf'"
    class="flex flex-wrap items-center gap-4 rounded-panneau border border-default p-4"
  >
    <span
      class="flex size-12 shrink-0 items-center justify-center rounded-feuille bg-elevated"
      aria-hidden="true"
    >
      <UIcon name="i-lucide-file-text" class="size-6 text-muted" />
    </span>
    <div class="min-w-0 flex-1">
      <p class="truncate font-medium text-highlighted">{{ contenu }}</p>
      <p class="text-sm text-muted">
        Document PDF<template v-if="taille"> · {{ taille }}</template>
      </p>
    </div>
    <UButton color="neutral" variant="outline" icon="i-lucide-external-link">
      Ouvrir le PDF
    </UButton>
  </div>

  <!-- Vidéo : lecteur factice -->
  <div v-else-if="type === 'video'" class="space-y-2">
    <div class="flex aspect-video items-center justify-center rounded-panneau bg-elevated">
      <UButton
        icon="i-lucide-play"
        size="xl"
        aria-label="Lire la vidéo (aperçu de démonstration)"
        class="size-14 justify-center"
      />
    </div>
    <p class="text-sm break-all text-muted">Source : {{ contenu }}</p>
  </div>

  <!-- Lien : adresse affichée -->
  <div v-else class="flex flex-wrap items-center gap-4 rounded-panneau border border-default p-4">
    <span
      class="flex size-12 shrink-0 items-center justify-center rounded-feuille bg-elevated"
      aria-hidden="true"
    >
      <UIcon name="i-lucide-link" class="size-6 text-muted" />
    </span>
    <div class="min-w-0 flex-1">
      <p class="font-medium break-all text-highlighted">{{ contenu }}</p>
      <p class="text-sm text-muted">Lien externe</p>
    </div>
    <UButton color="neutral" variant="outline" icon="i-lucide-external-link">
      Ouvrir le lien
    </UButton>
  </div>
</template>
