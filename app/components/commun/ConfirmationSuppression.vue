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

  À la fermeture, le focus revient à l'élément qui avait le focus à l'ouverture. Quand cet élément
  disparaît (le bouton « Supprimer » d'une ligne supprimée), `return-focus` désigne un repère stable :
    :return-focus="(reason) => (reason === 'confirm' ? sectionHeading : undefined)"
  Renvoyer `null` ou `undefined` garde le comportement par défaut.
-->
<script setup lang="ts">
type CloseReason = 'confirm' | 'cancel'

const props = withDefaults(
  defineProps<{
    title: string
    description: string
    /** Libellé du bouton de confirmation. */
    confirmLabel?: string
    /** Élément qui reçoit le focus à la fermeture, selon qu'elle confirme ou annule. */
    returnFocus?: (reason: CloseReason) => HTMLElement | null | undefined
  }>(),
  { confirmLabel: 'Supprimer', returnFocus: undefined },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const open = defineModel<boolean>('open', { default: false })

// Raison de la dernière fermeture, lue quand la fenêtre rend le focus (après son animation)
let closeReason: CloseReason = 'cancel'

function confirm() {
  closeReason = 'confirm'
  emit('confirm')
  open.value = false
}

function cancel() {
  closeReason = 'cancel'
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

// Focus de retour choisi par le parent ; sinon, la fenêtre le rend à l'élément d'origine
function onCloseAutoFocus(event: Event) {
  const target = props.returnFocus?.(closeReason)
  if (!target) return
  event.preventDefault()
  target.focus()
}

// `role` est transmis tel quel à la fenêtre : « alertdialog » signale une décision à prendre
const MODAL_CONTENT = { role: 'alertdialog', onOpenAutoFocus: focusCancel, onCloseAutoFocus }
</script>

<template>
  <UModal
    :open="open"
    :title="props.title"
    :description="props.description"
    :content="MODAL_CONTENT"
    :ui="{ footer: 'justify-end gap-2' }"
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
