import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import TraceForm from '~/components/trace/TraceForm.vue'

type Form = Awaited<ReturnType<typeof mountSuspended<typeof TraceForm>>>

// Les boutons envoient le formulaire eux-mêmes (type="button" : Entrée dans un champ ne change
// jamais le statut de la trace)
async function submitWith(form: Form, action: 'brouillon' | 'finaliser') {
  await form.get(`button[data-action="${action}"]`).trigger('click')
}

describe('formulaire de trace', () => {
  it('propose les champs attendus, chacun avec son libellé', async () => {
    const form = await mountSuspended(TraceForm)

    for (const label of [
      'Titre',
      'Adresse du lien',
      'Description',
      'Contexte',
      'Date de réalisation',
    ]) {
      expect(form.text()).toContain(label)
    }
    expect(form.text()).toContain('Usage de l’intelligence artificielle')
  })

  it('affiche l’erreur sous le champ et n’envoie rien si le titre manque', async () => {
    const form = await mountSuspended(TraceForm)

    await submitWith(form, 'finaliser')

    await vi.waitFor(() => expect(form.text()).toContain('Le titre est obligatoire.'))
    expect(form.emitted('submit')).toBeUndefined()
  })

  it('envoie un brouillon sans contenu', async () => {
    const form = await mountSuspended(TraceForm)

    await form.get('input[name="titre"]').setValue('Podcast alumni')
    await submitWith(form, 'brouillon')

    await vi.waitFor(() => expect(form.emitted('submit')).toHaveLength(1))
    expect(form.emitted('submit')?.[0]?.[0]).toMatchObject({
      titre: 'Podcast alumni',
      statut: 'brouillon',
      type: 'lien',
      contenu: [],
      conceptionIa: 'non_renseigne',
      realisationIa: 'non_renseigne',
    })
  })

  it('envoie une trace finalisée avec son adresse', async () => {
    const form = await mountSuspended(TraceForm)

    await form.get('input[name="titre"]').setValue('Refonte du site du BDE')
    await form.get('input[name="adresse"]').setValue('https://bde.example')
    await submitWith(form, 'finaliser')

    await vi.waitFor(() => expect(form.emitted('submit')).toHaveLength(1))
    expect(form.emitted('submit')?.[0]?.[0]).toMatchObject({
      statut: 'finalisee',
      contenu: ['https://bde.example'],
    })
  })

  // Les fichiers se gèrent au lot C : une trace image ou PDF garde son type et son fichier
  it('conserve le type et le fichier d’une trace PDF existante', async () => {
    const form = await mountSuspended(TraceForm, {
      props: {
        initial: {
          titre: 'Étude UX',
          description: null,
          contexte: null,
          type: 'pdf',
          contenu: ['/fichiers/etude-ux.pdf'],
          statut: 'finalisee',
          conceptionIa: 'aucun',
          realisationIa: 'aucun',
          dateRealisation: null,
        },
      },
    })

    expect(form.text()).toContain('etude-ux.pdf')
    expect(form.find('input[name="adresse"]').exists()).toBe(false)
    await submitWith(form, 'finaliser')

    await vi.waitFor(() => expect(form.emitted('submit')).toHaveLength(1))
    expect(form.emitted('submit')?.[0]?.[0]).toMatchObject({
      type: 'pdf',
      contenu: ['/fichiers/etude-ux.pdf'],
    })
  })

  it('affiche les erreurs du serveur sous les champs et renvoie celles sans champ', async () => {
    const form = await mountSuspended(TraceForm)

    const unmatched = form.vm.setServerErrors([
      { propertyPath: 'titre', message: 'Titre déjà utilisé.' },
      { propertyPath: 'statut', message: 'Statut refusé.' },
    ])

    await vi.waitFor(() => expect(form.text()).toContain('Titre déjà utilisé.'))
    expect(unmatched).toEqual([{ propertyPath: 'statut', message: 'Statut refusé.' }])
  })
})
