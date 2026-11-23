<script setup lang="ts">
// États d'un bloc de données (C-10) : chargement, erreur, vide, puis le contenu.
const props = defineProps<{
  status: 'idle' | 'pending' | 'success' | 'error'
  /** Erreur de l'appel : son message (ApiError, déjà en français) est affiché. */
  error?: unknown
  empty?: boolean
  /** État vide : titre court (« Aucune trace pour l'instant »), affiché au-dessus du message. */
  emptyTitle?: string
  emptyMessage?: string
  /**
   * Forme du squelette de chargement, proche du contenu attendu pour que rien ne saute à
   * l'arrivée des données : `bloc` (titre et paragraphe, par défaut), `liste` (cartes de liste en
   * `p-4`), `tuiles` (tableau de bord : panneau de progression et colonne de chiffres), `formulaire`.
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
      <!--
        Cartes de liste : bordure, p-4, titre, détail et pastilles ou actions. Hauteurs mesurées
        (Mes traces, pages d'un portfolio, traces d'une page) : 104 à 120 px sur ordinateur, 111 à
        179 px sur téléphone, où les actions passent sous le titre
      -->
      <div v-if="skeleton === 'liste'" class="space-y-3">
        <USkeleton
          v-for="n in skeletonCount"
          :key="n"
          class="h-36 w-full rounded-feuille sm:h-28"
        />
      </div>

      <!--
        Tableau de bord (/etudiant) : « À faire maintenant » (3 colonnes sur 5) et « Où vous en
        êtes » (2 sur 5) côte à côte, puis la progression sur toute la largeur. Hauteurs mesurées :
        voir le commentaire de chaque bloc
      -->
      <div v-else-if="skeleton === 'tuiles'" class="grid gap-6 lg:grid-cols-5">
        <!-- À faire maintenant -->
        <USkeleton class="h-96 rounded-panneau lg:col-span-3" />
        <!-- Où vous en êtes -->
        <USkeleton class="h-96 rounded-panneau lg:col-span-2" />
        <!-- Progression par compétence -->
        <USkeleton class="h-120 rounded-panneau lg:col-span-5" />
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

    <!--
      État vide : il dit ce qui manque et propose l'étape suivante (slot `empty-action`, un bouton
      principal ou secondaire) au lieu d'une simple phrase grise
    -->
    <div
      v-else-if="empty"
      :class="emptyTitle || $slots['empty-action'] ? 'rounded-panneau bg-muted p-6 sm:p-8' : ''"
    >
      <p v-if="emptyTitle" class="font-semibold leading-titre text-highlighted">{{ emptyTitle }}</p>
      <p class="max-w-mesure text-muted" :class="{ 'mt-1': emptyTitle }">
        {{ emptyMessage ?? 'Rien à afficher pour l’instant.' }}
      </p>
      <div v-if="$slots['empty-action']" class="mt-6 flex flex-wrap gap-2">
        <slot name="empty-action" />
      </div>
    </div>

    <slot v-else />
  </div>
</template>
