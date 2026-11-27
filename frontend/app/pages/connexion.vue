<!--
  Connexion (C-13) : identifiant et mot de passe envoyés à l'API (`POST /api/login`), puis retour à
  la page demandée ou à l'accueil de l'espace. Un utilisateur déjà connecté n'arrive pas ici : le
  garde de route (`middleware/auth.global.ts`) le renvoie vers son espace.
-->
<script setup lang="ts">
import type { FormError } from '@nuxt/ui'

useSeoMeta({
  title: 'Connexion',
  description: 'Connexion à UniFolio avec votre compte universitaire.',
})

const state = reactive({ identifiant: '', motDePasse: '' })
const isPasswordVisible = ref(false)
const { connect, connectDemo, isPending, error } = useConnexion()
/** Compte de démonstration en cours de connexion (indicateur sur sa seule ligne). */
const pendingDemo = ref<string | null>(null)

function validate(): FormError[] {
  const errors: FormError[] = []
  if (!state.identifiant.trim())
    errors.push({ name: 'identifiant', message: 'Saisissez votre identifiant universitaire.' })
  if (!state.motDePasse)
    errors.push({ name: 'motDePasse', message: 'Saisissez votre mot de passe.' })
  return errors
}

const { onError } = useFocusFirstError()

// Écran tactile : le bouton « afficher le mot de passe » passe à 44 px (bouton icône, app.config.ts).
// Les deux champs grandissent d'autant (ils gardent la même hauteur), et le texte saisi s'arrête
// avant le bouton au lieu de passer dessous.
const INPUT_UI = { base: 'pointer-coarse:min-h-11' }
const PASSWORD_UI = { base: 'pointer-coarse:min-h-11 pointer-coarse:pe-12', trailing: 'pe-1' }

async function onSubmit() {
  await connect({ username: state.identifiant.trim(), password: state.motDePasse })
}

async function onDemo(username: string) {
  pendingDemo.value = username
  await connectDemo(username)
  pendingDemo.value = null
}
</script>

<template>
  <div class="mx-auto w-full max-w-md px-4 py-12">
    <!--
      Échelle d'espacement : titre → texte 4, chapeau → formulaire 8, champs 6, entre sections 12
      (puis 8 sous le filet, qui rattache la section à son titre)
    -->
    <h1 class="font-titre text-4xl text-highlighted">Connexion</h1>
    <p class="mt-4 max-w-mesure text-muted">
      La connexion passe par votre compte de l’IUT : utilisez l’identifiant et le mot de passe de
      votre environnement numérique de travail (ENT).
    </p>

    <UForm
      :state="state"
      :validate="validate"
      :validate-on="['blur']"
      novalidate
      class="mt-8 flex flex-col gap-6"
      @submit="onSubmit"
      @error="onError"
    >
      <UFormField label="Identifiant universitaire" name="identifiant" required>
        <UInput
          v-model="state.identifiant"
          aria-required="true"
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
          size="lg"
          class="w-full"
          :ui="INPUT_UI"
        />
      </UFormField>

      <UFormField label="Mot de passe" name="motDePasse" required>
        <UInput
          id="mot-de-passe"
          v-model="state.motDePasse"
          aria-required="true"
          :type="isPasswordVisible ? 'text' : 'password'"
          autocomplete="current-password"
          size="lg"
          class="w-full"
          :ui="PASSWORD_UI"
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

      <div>
        <UButton type="submit" size="lg" block :loading="isPending && !pendingDemo">
          Se connecter
        </UButton>
        <!--
          Zone annoncée présente dès le départ : son contenu est lu quand il apparaît. Sous le
          bouton, elle ne le déplace pas sous le doigt ou le pointeur en apparaissant.
        -->
        <div role="alert">
          <UAlert
            v-if="error"
            color="error"
            variant="subtle"
            icon="i-lucide-circle-alert"
            title="Connexion impossible"
            :description="error"
            class="mt-4"
          />
        </div>
      </div>

      <p class="text-sm text-muted">
        Mot de passe oublié ? Il se réinitialise depuis l’ENT de l’IUT : UniFolio ne le connaît pas.
      </p>
    </UForm>

    <section aria-labelledby="acces-demo" class="mt-12 border-t border-default pt-8">
      <h2 id="acces-demo" class="font-semibold text-highlighted">Accès de démonstration</h2>
      <p class="mt-1 text-sm text-muted">
        Entrez dans l’un des trois espaces avec un compte fictif, sans saisir de mot de passe.
      </p>
      <ul class="mt-4 flex flex-col gap-3">
        <li v-for="compte in COMPTES_DEMO" :key="compte.username">
          <button
            type="button"
            :disabled="isPending"
            :aria-busy="pendingDemo === compte.username"
            class="flex w-full items-center gap-3 rounded-feuille border border-default p-4 text-start shadow-carte transition-[background-color,border-color,box-shadow] hover:border-accented hover:bg-muted hover:shadow-carte-survol focus-visible:shadow-carte-survol disabled:cursor-not-allowed disabled:opacity-75 motion-reduce:transition-none"
            @click="onDemo(compte.username)"
          >
            <UIcon :name="compte.icon" class="size-5 shrink-0 text-primary" />
            <span class="flex min-w-0 flex-1 flex-col">
              <span class="font-medium text-highlighted">{{ compte.espace }}</span>
              <span class="text-sm text-muted">{{ compte.description }}</span>
            </span>
            <UIcon
              :name="
                pendingDemo === compte.username ? 'i-lucide-loader-circle' : 'i-lucide-arrow-right'
              "
              class="size-4 shrink-0 text-muted"
              :class="{ 'motion-safe:animate-spin': pendingDemo === compte.username }"
              aria-hidden="true"
            />
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
