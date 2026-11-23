<script setup lang="ts">
import type { FileTraceType } from '#shared/utils/fichier'
import { toApiError } from '~/services/errors'
import { uploadFichier } from '~/services/fichier'

// Fichier d'une trace image ou PDF (E-TR-02) : contrôle du format réel et de la taille avant
// l'envoi, puis téléversement. La valeur est l'adresse du fichier enregistré.
//
// Accessibilité : le champ de dépôt de Nuxt UI relie libellé, formats et erreurs à un élément
// caché aux lecteurs d'écran. Ici, le seul contrôle est un vrai bouton, nommé (« Image »,
// « Choisir un fichier ») et décrit (formats, erreur) ; une zone vivante annonce l'envoi, la
// réussite et les erreurs. `UFileUpload` ne sert qu'à ouvrir la boîte de dialogue.
const props = defineProps<{
  type: FileTraceType
  modelValue: string | null
  /** Erreur venue du formulaire (validation, serveur). */
  formError?: string | null
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const ids = {
  label: useId(),
  action: useId(),
  description: useId(),
  current: useId(),
  error: useId(),
}

const selected = ref<File | null>(null)
const localError = ref<string | null>(null)
const uploading = ref(false)
/** Annonce aux lecteurs d'écran (zone toujours présente, seul son texte change). */
const announcement = ref('')
/** Nom du fichier déposé pendant cette visite (l'adresse d'un fichier déposé ne contient pas son nom). */
const uploadedName = ref<string | null>(null)

const rules = computed(() => FILE_RULES[props.type])
const label = computed(() => (props.type === 'image' ? 'Image' : 'Fichier PDF'))
const formats = computed(() =>
  props.type === 'image'
    ? `JPEG, PNG, WebP ou GIF, ${formatSize(rules.value.maxBytes)} au plus.`
    : `PDF, ${formatSize(rules.value.maxBytes)} au plus.`,
)
const error = computed(() => localError.value ?? props.formError ?? null)

/** Fichier en place : nom connu, sinon « Fichier déposé » (adresse `/api/fichiers/<id>`). */
const currentName = computed(() => {
  if (!props.modelValue) return null
  if (uploadedName.value) return uploadedName.value
  return props.modelValue.startsWith('/api/fichiers/')
    ? 'Fichier déposé'
    : (props.modelValue.split('/').pop() ?? 'Fichier')
})

const describedBy = computed(() =>
  [ids.description, currentName.value ? ids.current : null, error.value ? ids.error : null]
    .filter(Boolean)
    .join(' '),
)

/** Vide puis remplit la zone vivante : un message identique au précédent est relu. */
function announce(text: string) {
  announcement.value = ''
  nextTick(() => (announcement.value = text))
}

async function handle(file: File) {
  localError.value = null
  try {
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer())
    const problem = checkFile(props.type, { size: file.size, kind: detectFileKind(head) })
    if (problem) {
      localError.value = problem
      announce(problem)
      return
    }
    uploading.value = true
    announce(`Envoi de ${file.name}…`)
    const saved = await uploadFichier(file, props.type)
    uploadedName.value = saved.nom
    announce(`${saved.nom} déposé.`)
    emit('update:modelValue', saved['@id'])
  } catch (err) {
    const apiError = toApiError(err)
    localError.value = apiError.violations[0]?.message ?? apiError.message
    announce(localError.value)
  } finally {
    uploading.value = false
  }
}

watch(selected, (file) => {
  if (!file) return
  selected.value = null
  void handle(file)
})

/** Fichier glissé dans la zone : traité comme un fichier choisi, avec un message s'il est refusé. */
function onDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0]
  if (file && !uploading.value) void handle(file)
}
</script>

<template>
  <div class="space-y-2">
    <p :id="ids.label" class="text-sm font-medium text-default">{{ label }}</p>
    <p :id="ids.description" class="text-sm text-muted">{{ formats }}</p>

    <div v-if="currentName" class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <UIcon
        :name="type === 'image' ? 'i-lucide-image' : 'i-lucide-file-text'"
        class="size-4 text-muted"
        aria-hidden="true"
      />
      <span :id="ids.current" class="font-medium text-highlighted">{{ currentName }}</span>
      <ULink
        v-if="modelValue?.startsWith('/api/fichiers/')"
        :href="modelValue"
        target="_blank"
        class="text-primary underline underline-offset-4"
      >
        Ouvrir<span class="sr-only"> le fichier (nouvel onglet)</span>
      </ULink>
    </div>

    <UFileUpload v-model="selected" :accept="rules.accept" reset class="w-full">
      <template #default="{ open }">
        <div
          data-zone="depot"
          class="flex flex-col items-center gap-3 rounded-panneau border border-dashed p-6 text-center"
          :class="error ? 'border-error' : 'border-accented'"
          @dragover.prevent
          @drop.prevent="onDrop"
        >
          <p class="text-sm text-muted" aria-hidden="true">Glissez un fichier ici, ou</p>
          <UButton
            name="fichier"
            color="neutral"
            variant="outline"
            :icon="uploading ? 'i-lucide-loader-circle' : 'i-lucide-upload'"
            :ui="{ leadingIcon: uploading ? 'animate-spin motion-reduce:animate-none' : '' }"
            :aria-disabled="uploading ? 'true' : undefined"
            :aria-labelledby="`${ids.label} ${ids.action}`"
            :aria-describedby="describedBy"
            :aria-invalid="error ? 'true' : undefined"
            @click="uploading || open()"
          >
            <span :id="ids.action">
              {{ currentName ? 'Remplacer le fichier' : 'Choisir un fichier' }}
            </span>
          </UButton>
        </div>
      </template>
    </UFileUpload>

    <p v-if="error" :id="ids.error" class="text-sm text-error">{{ error }}</p>
    <p role="status" class="sr-only">{{ announcement }}</p>
  </div>
</template>
