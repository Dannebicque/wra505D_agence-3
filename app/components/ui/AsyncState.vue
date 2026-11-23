<script setup lang="ts">
// États d'un bloc de données (C-10) : chargement, erreur, vide, puis le contenu.
const props = defineProps<{
  status: 'idle' | 'pending' | 'success' | 'error'
  /** Erreur de l'appel : son message (ApiError, déjà en français) est affiché. */
  error?: unknown
  empty?: boolean
  emptyMessage?: string
  /**
   * Forme du squelette de chargement, proche du contenu attendu pour que rien ne saute à
   * l'arrivée des données : `bloc` (titre et paragraphe, par défaut), `liste` (cartes de liste en
   * `p-4`), `tuiles` (tuiles de statistiques et panneau du tableau de bord), `formulaire`.
   */
  skeleton?: 'bloc' | 'liste' | 'tuiles' | 'formulaire'
  /** Nombre de lignes de la liste ou de champs du formulaire (3 par défaut). */
  skeletonCount?: number
}>()

defineEmits<{ retry: [] }>()

const skeletonCount = computed(() => props.skeletonCount ?? 3)
const isLoading = computed(() => props.status === 'pending' || props.status === 'idle')
const errorMessage = computed(() => {
  const message = (props.error as { message?: unknown } | undefined)?.message
  return typeof message === 'string' && message.trim() !== ''
    ? message
    : 'Une erreur est survenue. Réessayez plus tard.'
})
</script>

<template>
  <!-- Racine unique : les classes passées au composant s'appliquent dans tous les états -->
  <div>
    <!-- Zone vivante permanente : seul son texte change, ce que les lecteurs d'écran annoncent -->
    <p role="status" class="sr-only">{{ isLoading ? 'Chargement…' : '' }}</p>

    <div v-if="isLoading" aria-hidden="true" :data-skeleton="skeleton ?? 'bloc'">
      <!-- Cartes de liste : bordure, p-4, un titre et une ligne de détail (≈ 80 px) -->
      <div v-if="skeleton === 'liste'" class="space-y-3">
        <USkeleton v-for="n in skeletonCount" :key="n" class="h-20 w-full rounded-feuille" />
      </div>

      <!-- Tableau de bord : quatre tuiles (deux par ligne sur téléphone), puis un panneau -->
      <div v-else-if="skeleton === 'tuiles'" class="space-y-3 lg:space-y-4">
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <USkeleton v-for="n in 4" :key="n" class="h-24 rounded-panneau lg:h-28" />
        </div>
        <USkeleton class="h-48 w-full rounded-panneau" />
      </div>

      <!-- Formulaire : libellé puis champ (hauteur d'un UInput), champs espacés de 6 pas -->
      <div v-else-if="skeleton === 'formulaire'" class="max-w-2xl space-y-6">
        <div v-for="n in skeletonCount" :key="n" class="space-y-2">
          <USkeleton class="h-4 w-32" />
          <USkeleton class="h-9 w-full" />
        </div>
      </div>

      <!-- Bloc : un titre de section et un paragraphe de trois lignes -->
      <div v-else class="space-y-4">
        <USkeleton class="h-6 w-2/3" />
        <div class="max-w-mesure space-y-2">
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-1/2" />
        </div>
      </div>
    </div>

    <UAlert
      v-else-if="status === 'error'"
      color="error"
      variant="subtle"
      title="Impossible d’afficher ces informations"
      :description="errorMessage"
      :actions="[
        { label: 'Réessayer', color: 'error', variant: 'outline', onClick: () => $emit('retry') },
      ]"
    />

    <p v-else-if="empty" class="text-muted">
      {{ emptyMessage ?? 'Rien à afficher pour l’instant.' }}
    </p>

    <slot v-else />
  </div>
</template>
