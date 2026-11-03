<!--
  Confirmation avant suppression (C-08), réutilisable par tous les écrans :
    <CommunConfirmationSuppression
      v-model:open="isConfirmOpen"
      title="Supprimer cette trace ?"
      description="La trace et ses évaluations seront supprimées."
      @confirm="removeTrace"
    />
  Le focus arrive sur « Annuler » (l'action sans risque). Fermer la fenêtre autrement que par la
  confirmation (Échap, croix, clic à l'extérieur) émet `cancel`.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string
    description: string
    /** Libellé du bouton de confirmation. */
    confirmLabel?: string
  }>(),
  { confirmLabel: 'Supprimer' },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const open = defineModel<boolean>('open', { default: false })

function confirm() {
  emit('confirm')
  open.value = false
}

function cancel() {
  emit('cancel')
  open.value = false
}

// Fermeture demandée par la fenêtre elle-même (Échap, croix, clic à l'extérieur) : vaut annulation
function onUpdateOpen(value: boolean) {
  if (value) open.value = true
  else cancel()
}

// Focus initial sur « Annuler » plutôt que sur le premier élément (la croix de fermeture)
function focusCancel(event: Event) {
  const cancelButton = (event.target as HTMLElement | null)?.querySelector<HTMLElement>(
    '[data-confirmation-cancel]',
  )
  if (!cancelButton) return
  event.preventDefault()
  cancelButton.focus()
}

// `role` est transmis tel quel à la fenêtre : « alertdialog » signale une décision à prendre
const MODAL_CONTENT = { role: 'alertdialog', onOpenAutoFocus: focusCancel }
</script>

<template>
  <UModal
    :open="open"
    :title="props.title"
    :description="props.description"
    :content="MODAL_CONTENT"
    :ui="{ footer: 'justify-end' }"
    @update:open="onUpdateOpen"
  >
    <template #footer>
      <UButton color="neutral" variant="outline" data-confirmation-cancel @click="cancel">
        Annuler
      </UButton>
      <UButton color="error" icon="i-lucide-trash-2" @click="confirm">
        {{ props.confirmLabel }}
      </UButton>
    </template>
  </UModal>
</template>
