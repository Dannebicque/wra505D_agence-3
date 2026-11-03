<script setup lang="ts">
import type { FileTraceType } from '#shared/utils/fichier'
import { toApiError } from '~/services/errors'
import { uploadFichier } from '~/services/fichier'

// Fichier d'une trace image ou PDF (E-TR-02) : contrôle du format réel et de la taille avant
// l'envoi, puis téléversement. La valeur est l'adresse du fichier enregistré.
const props = defineProps<{
  type: FileTraceType
  modelValue: string | null
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const selected = ref<File | null>(null)
const error = ref<string | null>(null)
const uploading = ref(false)
/** Nom du fichier déposé pendant cette visite (l'adresse d'un fichier déposé ne contient pas son nom). */
const uploadedName = ref<string | null>(null)

const rules = computed(() => FILE_RULES[props.type])
const formats = computed(() =>
  props.type === 'image'
    ? `JPEG, PNG, WebP ou GIF, ${formatSize(rules.value.maxBytes)} au plus.`
    : `PDF, ${formatSize(rules.value.maxBytes)} au plus.`,
)
/** Fichier en place : nom connu, sinon « Fichier déposé » (adresse `/api/fichiers/<id>`). */
const currentName = computed(() => {
  if (!props.modelValue) return null
  if (uploadedName.value) return uploadedName.value
  return props.modelValue.startsWith('/api/fichiers/')
    ? 'Fichier déposé'
    : (props.modelValue.split('/').pop() ?? 'Fichier')
})

watch(selected, async (file) => {
  if (!file) return
  error.value = null
  try {
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer())
    const problem = checkFile(props.type, { size: file.size, kind: detectFileKind(head) })
    if (problem) {
      error.value = problem
      return
    }
    uploading.value = true
    const saved = await uploadFichier(file, props.type)
    uploadedName.value = saved.nom
    emit('update:modelValue', saved['@id'])
  } catch (err) {
    const apiError = toApiError(err)
    error.value = apiError.violations[0]?.message ?? apiError.message
  } finally {
    uploading.value = false
    selected.value = null
  }
})
</script>

<template>
  <UFormField
    :label="type === 'image' ? 'Image' : 'Fichier PDF'"
    name="fichier"
    :description="formats"
    :error="error ?? undefined"
  >
    <div v-if="currentName" class="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <UIcon
        :name="type === 'image' ? 'i-lucide-image' : 'i-lucide-file-text'"
        class="size-4 text-muted"
        aria-hidden="true"
      />
      <span class="font-medium text-highlighted">{{ currentName }}</span>
      <ULink
        v-if="modelValue?.startsWith('/api/fichiers/')"
        :href="modelValue"
        target="_blank"
        class="text-primary underline underline-offset-4"
      >
        Ouvrir<span class="sr-only"> le fichier (nouvel onglet)</span>
      </ULink>
    </div>

    <!-- Variante « zone » : la variante « bouton » n'affiche qu'une icône, sans nom accessible -->
    <UFileUpload
      v-model="selected"
      :accept="rules.accept"
      variant="area"
      :label="
        currentName ? 'Remplacer le fichier' : 'Déposez un fichier ou cliquez pour le choisir'
      "
      :disabled="uploading"
      class="w-full"
    />
    <p v-if="uploading" role="status" class="mt-2 text-sm text-muted">Envoi du fichier…</p>
  </UFormField>
</template>
