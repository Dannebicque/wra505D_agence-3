<!--
  Connexion (C-13), maquette : le formulaire vérifie la saisie mais ne connecte pas encore.
  La vraie authentification passera par le compte de l'IUT ; en attendant, l'accès de
  démonstration mène directement aux trois espaces.
-->
<script setup lang="ts">
import type { FormError } from '@nuxt/ui'

useSeoMeta({
  title: 'Connexion',
  description: 'Connexion à UniFolio avec votre compte universitaire.',
})

const state = reactive({ identifiant: '', motDePasse: '' })
const isPasswordVisible = ref(false)
const hasSubmitted = ref(false)

function validate(): FormError[] {
  const errors: FormError[] = []
  if (!state.identifiant.trim())
    errors.push({ name: 'identifiant', message: 'Saisissez votre identifiant universitaire.' })
  if (!state.motDePasse)
    errors.push({ name: 'motDePasse', message: 'Saisissez votre mot de passe.' })
  return errors
}

const { onError } = useFocusFirstError()

// Maquette : aucun appel, on signale seulement que la connexion n'est pas encore branchée
function onSubmit() {
  hasSubmitted.value = true
}

const DEMO_ACCESS = [
  {
    label: 'Espace étudiant',
    description: 'Léa Martin, BUT MMI 2',
    to: '/etudiant',
    icon: 'i-lucide-graduation-cap',
  },
  {
    label: 'Espace enseignant',
    description: 'Claire Dupont',
    to: '/enseignant',
    icon: 'i-lucide-presentation',
  },
  {
    label: 'Administration',
    description: 'Gestion de la structure',
    to: '/admin',
    icon: 'i-lucide-shield',
  },
]
</script>

<template>
  <div class="mx-auto flex w-full max-w-md flex-col gap-8 px-4 py-12 sm:py-20">
    <div>
      <h1 class="font-titre text-4xl text-highlighted">Connexion</h1>
      <p class="mt-3 text-muted">
        La connexion passe par votre compte de l’IUT : utilisez l’identifiant et le mot de passe de
        votre environnement numérique de travail (ENT).
      </p>
    </div>

    <UForm
      :state="state"
      :validate="validate"
      :validate-on="['blur']"
      novalidate
      class="flex flex-col gap-5"
      @submit="onSubmit"
      @error="onError"
    >
      <UFormField label="Identifiant universitaire" name="identifiant" required>
        <UInput
          v-model="state.identifiant"
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Mot de passe" name="motDePasse" required>
        <UInput
          id="mot-de-passe"
          v-model="state.motDePasse"
          :type="isPasswordVisible ? 'text' : 'password'"
          autocomplete="current-password"
          size="lg"
          class="w-full"
          :ui="{ trailing: 'pe-1' }"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              :icon="isPasswordVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              aria-label="Afficher le mot de passe"
              :aria-pressed="isPasswordVisible"
              aria-controls="mot-de-passe"
              @click="isPasswordVisible = !isPasswordVisible"
            />
          </template>
        </UInput>
      </UFormField>

      <!-- Zone annoncée présente dès le départ : son contenu est lu quand il apparaît -->
      <div role="status">
        <UAlert
          v-if="hasSubmitted"
          color="neutral"
          variant="subtle"
          icon="i-lucide-info"
          title="La connexion n’est pas encore disponible"
          description="Le lien avec les comptes de l’IUT arrive bientôt. Utilisez l’accès de démonstration ci-dessous."
        />
      </div>

      <UButton type="submit" size="lg" block>Se connecter</UButton>

      <p class="text-sm text-muted">
        Mot de passe oublié ? Il se réinitialise depuis l’ENT de l’IUT : UniFolio ne le connaît pas.
      </p>
    </UForm>

    <section aria-labelledby="acces-demo" class="flex flex-col gap-3 border-t border-default pt-8">
      <h2 id="acces-demo" class="font-semibold text-highlighted">Accès de démonstration</h2>
      <p class="text-sm text-muted">
        En attendant la connexion, entrez directement dans l’un des trois espaces.
      </p>
      <ul class="flex flex-col gap-2">
        <li v-for="access in DEMO_ACCESS" :key="access.to">
          <NuxtLink
            :to="access.to"
            class="flex items-center gap-3 rounded-feuille border border-default px-4 py-3 transition-colors hover:bg-muted"
          >
            <UIcon :name="access.icon" class="size-5 shrink-0 text-primary" />
            <span class="flex min-w-0 flex-1 flex-col">
              <span class="font-medium text-highlighted">{{ access.label }}</span>
              <span class="text-sm text-muted">{{ access.description }}</span>
            </span>
            <UIcon name="i-lucide-arrow-right" class="size-4 shrink-0 text-muted" />
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
