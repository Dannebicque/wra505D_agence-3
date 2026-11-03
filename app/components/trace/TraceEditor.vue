<script setup lang="ts">
import type { Trace, TraceInput, TraceStatut } from '#shared/types/trace'
import { toApiError } from '~/services/errors'
import type { AutosaveStatus } from '~/utils/autosave'

// Éditeur d'une trace (création et modification) avec sauvegarde automatique (E-TR-10, C-06)
const props = defineProps<{ trace?: Trace }>()

const NEW_PATH = '/etudiant/traces/nouvelle'

const store = useTraceStore()
const form = useTemplateRef('form')
const today = todayInParis()

/** Identifiant de la trace : null tant qu'une nouvelle trace n'a pas été enregistrée. */
const traceId = ref<string | null>(props.trace ? idFromIri(props.trace['@id']) : null)
/**
 * Statut enregistré : la sauvegarde automatique l'envoie toujours. Seuls « Finaliser » et
 * « Enregistrer le brouillon », une fois réussis, le changent (un clic refusé ne compte pas).
 */
const savedStatut = ref<TraceStatut>(props.trace?.statut ?? 'brouillon')
const draft = ref<TraceInput | null>(null)
/** Enregistrement explicite en cours (y compris l'attente de la sauvegarde automatique). */
const finishing = ref(false)
/** Révision de la saisie au moment de l'enregistrement explicite. */
let submittedRevision: number | undefined
let mounted = true

/** Saisie à enregistrer automatiquement, avec le statut enregistré (jamais celui d'un clic refusé). */
const withSavedStatut = (input: TraceInput): TraceInput => ({ ...input, statut: savedStatut.value })

// La source ne contient pas le statut : un changement de statut ne déclenche aucun envoi
const autosave = createAutosave(() => draft.value, {
  isValid: (input) => input !== null && validateTrace(withSavedStatut(input), { today }).ok,
  // Pas d'envoi concurrent pendant un enregistrement explicite (sinon une création en double)
  isEnabled: () => !finishing.value && !submitting.value,
  save: async (input) => {
    const result = input && validateTrace(withSavedStatut(input), { today })
    if (!result?.ok) return
    const saved = await store.save(traceId.value, result.value)
    if (!traceId.value) {
      traceId.value = idFromIri(saved['@id'])
      rewriteAddress(`/etudiant/traces/${traceId.value}`)
    }
  },
})

/**
 * Nouvelle trace créée en brouillon : l'adresse devient celle de la trace, sans recharger la page
 * (la saisie en cours n'est pas interrompue). Seulement si l'éditeur est encore affiché à
 * l'adresse de création (pas après un retour arrière), et `current` est mis à jour pour que le
 * routeur ne remette pas l'ancienne adresse à la navigation suivante. `useRoute()` reste sur
 * `/nouvelle` jusqu'à la sortie de la page.
 */
function rewriteAddress(path: string) {
  if (!mounted || window.location.pathname !== NEW_PATH) return
  window.history.replaceState({ ...window.history.state, current: path }, '', path)
}

// Le statut enregistré ne change qu'après un enregistrement explicite RÉUSSI
const { submit, submitting } = useTraceSubmit(
  () => traceId.value,
  form,
  (input) => {
    savedStatut.value = input.statut
    autosave.markSaved(submittedRevision)
  },
)

async function onSubmit(input: TraceInput) {
  if (finishing.value || submitting.value) return // double clic
  finishing.value = true
  try {
    // Une sauvegarde automatique en cours se termine d'abord (la trace a alors son identifiant)
    await autosave.flush()
    submittedRevision = autosave.revision.value
    await submit(input)
  } finally {
    finishing.value = false
  }
}

// Rien de perdu en quittant : enregistrement immédiat, puis confirmation s'il reste des modifications
onBeforeRouteLeave(async () => {
  await autosave.flush()
  if (autosave.hasUnsavedChanges.value) {
    return window.confirm('Certaines modifications ne sont pas enregistrées. Quitter quand même ?')
  }
})

function warnBeforeUnload(event: BeforeUnloadEvent) {
  if (!autosave.hasUnsavedChanges.value) return
  event.preventDefault()
  event.returnValue = '' // navigateurs plus anciens
}
// Sur mobile, `beforeunload` n'est pas fiable : on enregistre dès que la page est masquée
function saveWhenHidden() {
  if (document.visibilityState === 'hidden') void autosave.flush()
}
onMounted(() => {
  window.addEventListener('beforeunload', warnBeforeUnload)
  document.addEventListener('visibilitychange', saveWhenHidden)
  window.addEventListener('pagehide', saveWhenHidden)
})
onBeforeUnmount(() => {
  mounted = false
  autosave.stop()
  window.removeEventListener('beforeunload', warnBeforeUnload)
  document.removeEventListener('visibilitychange', saveWhenHidden)
  window.removeEventListener('pagehide', saveWhenHidden)
})

const time = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Paris',
})

const LABELS: Record<Exclude<AutosaveStatus, 'saved' | 'error'>, string> = {
  idle: 'Les modifications sont enregistrées automatiquement.',
  pending: 'Modifications en attente…',
  saving: 'Enregistrement…',
  invalid: 'Non enregistré : la saisie est incomplète ou invalide.',
}

const statusLabel = computed(() => {
  const status = autosave.status.value
  if (status === 'saved') {
    const at = autosave.lastSavedAt.value
    return at ? `Enregistré à ${time.format(at).replace(':', ' h ')}` : 'Enregistré'
  }
  if (status === 'error') {
    const error = toApiError(autosave.lastError.value)
    const details = error.violations.map((v) => v.message).join(' ')
    return `Échec de l’enregistrement : ${details || error.message}`
  }
  return LABELS[status]
})

// Annonce aux lecteurs d'écran : seulement quand l'état change vraiment (pas à chaque pause de frappe)
const announcement = ref('')
let announced: AutosaveStatus | null = null
watch(autosave.status, (status) => {
  if (!['saved', 'invalid', 'error'].includes(status) || status === announced) return
  announced = status
  announcement.value = statusLabel.value
})
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
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
      <UButton
        v-if="autosave.status.value === 'error'"
        size="xs"
        color="error"
        variant="outline"
        @click="autosave.flush()"
      >
        Réessayer
      </UButton>
    </div>
    <p role="status" class="sr-only">{{ announcement }}</p>

    <TraceForm
      ref="form"
      :initial="trace"
      :submitting="submitting || finishing"
      class="mt-6"
      @change="draft = $event"
      @submit="onSubmit"
    />
  </div>
</template>
