<script setup lang="ts">
/**
 * Filtre choisi dans une liste avec recherche (`USelectMenu`), pour les listes longues ou dans
 * lesquelles on cherche un nom (compétence, étudiant, groupe).
 *
 * Le déclencheur de `USelectMenu` est un bouton : nommé par le seul `<label for>`, il ne dit pas la
 * valeur choisie (WCAG 4.1.2). Son nom réunit donc le libellé et son propre contenu
 * (`aria-labelledby="<libellé> <déclencheur>"`) : « Compétence Toutes les compétences », lu au focus
 * comme après un choix, à l'image d'un `USelect`. Le champ de recherche de la liste ouverte a son
 * propre identifiant (sinon il reprend celui du déclencheur) et son propre nom.
 */
interface FiltreItem {
  label: string
  value: string
}

const props = defineProps<{
  label: string
  items: FiltreItem[]
  /** Nom du champ de recherche de la liste ouverte, ex. « Filtrer les compétences ». */
  searchLabel: string
}>()

const model = defineModel<string>({ required: true })

const id = useId()

// Attributs HTML du champ (id, aria-label) : `UInput` les transmet à son <input>, mais son type
// de props ne les déclare pas ; un objet nommé (et non littéral) passe la vérification de type
const searchInput = computed(() => ({
  id: `${id}-recherche`,
  'aria-label': props.searchLabel,
  placeholder: `${props.searchLabel}…`,
}))
</script>

<template>
  <UFormField>
    <template #label>
      <span :id="`${id}-libelle`">{{ label }}</span>
    </template>
    <USelectMenu
      :id="id"
      v-model="model"
      :items="items"
      value-key="value"
      :aria-labelledby="`${id}-libelle ${id}`"
      :search-input="searchInput"
      class="w-full"
    />
  </UFormField>
</template>
