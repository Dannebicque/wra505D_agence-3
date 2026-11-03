<script setup lang="ts">
import type { Trace, TraceInput } from '#shared/types/trace'
import type { AutosaveStatus } from '~/utils/autosave'

// Éditeur d'une trace (création et modification) avec sauvegarde automatique (E-TR-10, C-06)
const props = defineProps<{ trace?: Trace }>()

const store = useTraceStore()
const form = useTemplateRef('form')
const today = todayInParis()

/** Identifiant de la trace : null tant qu'une nouvelle trace n'a pas été enregistrée. */
const traceId = ref<string | null>(props.trace ? idFromIri(props.trace['@id']) : null)
const draft = ref<TraceInput | null>(null)

const { submit, submitting } = useTraceSubmit(
  () => traceId.value,
  form,
  () => autosave.stop(),
)

const autosave = createAutosave(() => draft.value, {
  isValid: (input) => input !== null && validateTrace(input, { today }).ok,
  // Pas d'envoi concurrent pendant un enregistrement explicite (sinon une création en double)
  isEnabled: () => !submitting.value,
  save: async (input) => {
    if (!input) return
    const saved = await store.save(traceId.value, input)
    if (!traceId.value) {
      // Nouvelle trace créée en brouillon : l'adresse devient celle de la trace, sans recharger
      // la page (la saisie en cours n'est pas interrompue)
      traceId.value = idFromIri(saved['@id'])
      window.history.replaceState(window.history.state, '', `/etudiant/traces/${traceId.value}`)
    }
  },
})
onBeforeUnmount(() => autosave.stop())

async function onSubmit(input: TraceInput) {
  // Une sauvegarde automatique en cours se termine d'abord (la trace a alors son identifiant)
  await autosave.flush()
  await submit(input)
}

// Rien de perdu en quittant : enregistrement immédiat, puis confirmation s'il reste des modifications
onBeforeRouteLeave(async () => {
  await autosave.flush()
  if (autosave.hasUnsavedChanges.value) {
    return window.confirm('Certaines modifications ne sont pas enregistrées. Quitter quand même ?')
  }
})
function warnBeforeUnload(event: BeforeUnloadEvent) {
  if (autosave.hasUnsavedChanges.value) event.preventDefault()
}
onMounted(() => window.addEventListener('beforeunload', warnBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnBeforeUnload))

const time = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Paris',
})

const LABELS: Record<AutosaveStatus, string> = {
  idle: 'Les modifications sont enregistrées automatiquement.',
  pending: 'Modifications en attente…',
  saving: 'Enregistrement…',
  saved: '',
  invalid: 'Non enregistré : la saisie est incomplète ou invalide.',
  error: 'Échec de l’enregistrement. Nouvel essai à la prochaine modification.',
}

const statusLabel = computed(() =>
  autosave.status.value === 'saved' && autosave.lastSavedAt.value
    ? `Enregistré à ${time.format(autosave.lastSavedAt.value).replace(':', ' h ')}`
    : LABELS[autosave.status.value],
)
// Seuls les états qui comptent sont annoncés aux lecteurs d'écran (pas chaque pause de frappe)
const announcement = computed(() =>
  ['saved', 'invalid', 'error'].includes(autosave.status.value) ? statusLabel.value : '',
)
</script>

<template>
  <div>
    <p
      class="text-sm"
      :class="autosave.status.value === 'error' ? 'text-error' : 'text-muted'"
      data-testid="etat-sauvegarde"
    >
      <UIcon
        v-if="autosave.status.value === 'saved'"
        name="i-lucide-check"
        class="mr-1 align-[-2px]"
        aria-hidden="true"
      />
      {{ statusLabel }}
    </p>
    <p role="status" class="sr-only">{{ announcement }}</p>

    <TraceForm
      ref="form"
      :initial="trace"
      :submitting="submitting"
      class="mt-6"
      @change="draft = $event"
      @submit="onSubmit"
    />
  </div>
</template>
