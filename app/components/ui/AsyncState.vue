<script setup lang="ts">
// États d'un bloc de données (C-10) : chargement, erreur, vide, puis le contenu.
const props = defineProps<{
  status: 'idle' | 'pending' | 'success' | 'error'
  /** Erreur de l'appel : son message (ApiError, déjà en français) est affiché. */
  error?: unknown
  empty?: boolean
  emptyMessage?: string
}>()

defineEmits<{ retry: [] }>()

const errorMessage = computed(() => {
  const message = (props.error as { message?: unknown } | undefined)?.message
  return typeof message === 'string' && message.trim() !== ''
    ? message
    : 'Une erreur est survenue. Réessayez plus tard.'
})
</script>

<template>
  <div v-if="status === 'pending' || status === 'idle'" role="status" class="space-y-3">
    <span class="sr-only">Chargement…</span>
    <USkeleton class="h-6 w-2/3" />
    <USkeleton class="h-24 w-full" />
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
</template>
