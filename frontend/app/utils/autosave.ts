// Sauvegarde automatique (E-TR-10, C-06). Logique pure Vue (sans Nuxt) : testable dans le projet `unit`.
import { computed, ref, watch } from 'vue'

export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'invalid' | 'error'

export interface AutosaveOptions<T> {
  save: (value: T) => Promise<void>
  /** Une saisie invalide n'est pas envoyée (le statut passe à « invalid »). */
  isValid?: (value: T) => boolean
  /** En pause (ex. pendant un enregistrement explicite) : rien n'est envoyé, rien n'est perdu. */
  isEnabled?: () => boolean
  /** Délai après la dernière modification, en millisecondes. */
  delay?: number
  now?: () => Date
}

/**
 * Enregistre `source()` après `delay` ms sans modification. Un seul enregistrement à la fois :
 * si la valeur change pendant un envoi, la dernière valeur est enregistrée juste après.
 * Un échec n'est pas réessayé en boucle : la modification suivante relance l'enregistrement.
 */
export function createAutosave<T>(
  source: () => T,
  {
    save,
    isValid = () => true,
    isEnabled = () => true,
    delay = 1500,
    now = () => new Date(),
  }: AutosaveOptions<T>,
) {
  const status = ref<AutosaveStatus>('idle')
  const lastSavedAt = ref<Date | null>(null)
  /** Erreur du dernier échec (affichée à l'utilisateur), effacée par un enregistrement réussi. */
  const lastError = ref<unknown>(null)
  /** Modifications pas encore enregistrées. */
  const dirty = ref(false)
  /** Compteur de modifications : permet de savoir si la saisie a changé depuis un instant donné. */
  const revision = ref(0)

  let timer: ReturnType<typeof setTimeout> | undefined
  let inFlight: Promise<void> | null = null
  let rerun = false

  function schedule() {
    clearTimeout(timer)
    timer = setTimeout(() => void run(), delay)
  }

  async function run(): Promise<void> {
    clearTimeout(timer)
    if (inFlight) {
      rerun = true
      return inFlight
    }
    if (!dirty.value) return
    if (!isEnabled()) {
      // En pause : on réessaie plus tard, sans attendre une nouvelle modification
      schedule()
      return
    }

    const value = source()
    if (!isValid(value)) {
      status.value = 'invalid'
      return
    }

    status.value = 'saving'
    dirty.value = false
    let failed = false
    inFlight = save(value).then(
      () => {
        lastSavedAt.value = now()
        lastError.value = null
        if (!dirty.value) status.value = 'saved'
      },
      (error: unknown) => {
        failed = true
        lastError.value = error
        dirty.value = true
        status.value = 'error'
      },
    )
    await inFlight
    inFlight = null

    if (rerun) {
      rerun = false
      if (dirty.value && !failed) await run()
    }
  }

  const stopWatch = watch(
    source,
    () => {
      revision.value++
      dirty.value = true
      status.value = 'pending'
      schedule()
    },
    { deep: true },
  )

  return {
    status,
    lastSavedAt,
    lastError,
    revision,
    hasUnsavedChanges: computed(() => dirty.value || status.value === 'saving'),
    /** Enregistre tout de suite ce qui est en attente (avant de quitter la page). */
    async flush() {
      if (inFlight) await inFlight
      await run()
    },
    /**
     * La saisie vient d'être enregistrée autrement (enregistrement explicite) : plus rien en attente,
     * sauf si elle a changé depuis `atRevision` (une frappe pendant l'envoi n'est pas effacée).
     */
    markSaved(atRevision?: number) {
      if (atRevision !== undefined && atRevision !== revision.value) return
      clearTimeout(timer)
      dirty.value = false
      status.value = 'saved'
      lastSavedAt.value = now()
    },
    stop() {
      stopWatch()
      clearTimeout(timer)
    },
  }
}
