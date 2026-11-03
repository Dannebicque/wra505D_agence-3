<script setup lang="ts">
import type { TraceType } from '#shared/types/trace'

// Pièce jointe d'une trace, selon son type (maquette : aucun fichier chargé, aucune ressource
// externe ; le bouton d'ouverture est visible mais sans effet tant que la page n'est pas branchée).
// Une même carte pour les quatre types, plutôt qu'un faux visuel : rien n'est montré qui n'existe pas.
const props = defineProps<{
  type: TraceType
  /** Nom du fichier (image, PDF) ou adresse (lien, vidéo). */
  contenu: string
  legende: string | null
  taille: string | null
}>()

const KINDS: Record<TraceType, { label: string; action: string }> = {
  image: { label: 'Image', action: 'Ouvrir l’image' },
  pdf: { label: 'Document PDF', action: 'Ouvrir le PDF' },
  video: { label: 'Vidéo', action: 'Lire la vidéo' },
  lien: { label: 'Lien externe', action: 'Ouvrir le lien' },
}
const kind = computed(() => KINDS[props.type])
// Une adresse (lien, vidéo) peut être longue et sans espace : elle passe à la ligne n'importe où
const isAddress = computed(() => props.type === 'lien' || props.type === 'video')
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center gap-x-4 gap-y-3">
      <UIcon :name="TRACE_TYPE_ICONS[type]" class="size-5 shrink-0 text-muted" aria-hidden="true" />
      <div class="min-w-0 flex-1">
        <p
          class="font-medium text-highlighted"
          :class="isAddress ? 'break-all' : 'wrap-break-word'"
        >
          {{ contenu }}
        </p>
        <p class="text-sm text-muted">
          {{ kind.label }}<template v-if="taille"> · {{ taille }}</template>
        </p>
      </div>
      <UButton color="neutral" variant="outline" icon="i-lucide-external-link">
        {{ kind.action }}
      </UButton>
    </div>

    <!-- Image : la légende sert de texte alternatif ; l'enseignant doit pouvoir la lire et l'évaluer -->
    <p v-if="type === 'image'" class="rounded-feuille bg-default px-4 py-3 text-sm text-default">
      <span class="font-medium text-highlighted">Légende (texte alternatif) :</span>
      {{ legende ?? 'aucune légende fournie par l’étudiant.' }}
    </p>
  </div>
</template>
