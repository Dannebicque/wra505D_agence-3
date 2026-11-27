import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test'

/** Comptes de démonstration (doublure Nitro et fixtures de l'API), mot de passe `test`. */
export type Compte = 'etudiant' | 'enseignant' | 'admin'

/**
 * Compte qui ouvre un chemin : celui de son espace (`/enseignant/…` → `enseignant`), aucun hors des
 * espaces (connexion, portfolio public). Pour les tests qui parcourent une liste de pages.
 */
export function compteDe(path: string): Compte | null {
  const espace = /^\/(etudiant|enseignant|admin)(\/|\?|$)/.exec(path)?.[1]
  return (espace as Compte | undefined) ?? null
}

/**
 * Ouvre la session d'un compte. Avec une page, la connexion passe par le contexte du navigateur :
 * le cookie posé sert aussi aux pages ouvertes ensuite. Appeler à nouveau change de compte.
 */
export async function loginAs(target: Page | APIRequestContext, compte: Compte) {
  const request = 'request' in target ? target.request : target
  const response = await request.post('/api/login', {
    data: { username: compte, password: 'test' },
  })
  expect(response.status(), `connexion au compte « ${compte} »`).toBe(204)
}

/**
 * `test` des E2E : chaque test commence connecté (par défaut au compte `etudiant`), le navigateur
 * comme `request`. Un fichier ou un bloc choisit un autre compte par `test.use({ compte: … })`, ou
 * aucun (`compte: null`) pour éprouver le parcours d'un visiteur.
 */
export const test = base.extend<{ compte: Compte | null }>({
  compte: ['etudiant', { option: true }],
  context: async ({ context, compte }, use) => {
    if (compte) await loginAs(context.request, compte)
    await use(context)
  },
  request: async ({ request, compte }, use) => {
    if (compte) await loginAs(request, compte)
    await use(request)
  },
})

export { expect }
export type { Page } from '@playwright/test'
