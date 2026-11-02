import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import TraceForm from '~/components/trace/TraceForm.vue'

type Form = Awaited<ReturnType<typeof mountSuspended<typeof TraceForm>>>

// happy-dom ne soumet pas le formulaire au clic d'un bouton « submit » (les navigateurs, si :
// voir l'E2E) : le clic fixe le statut, puis on soumet le formulaire
async function submitWith(form: Form, action: 'brouillon' | 'finaliser') {
  await form.get(`button[data-action="${action}"]`).trigger('click')
  await form.get('form').trigger('submit')
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
})

