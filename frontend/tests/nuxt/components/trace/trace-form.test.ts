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
          legende: null,
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

  describe('section « Plus de détails »', () => {
    const toggle = (form: Form) => form.get('button[aria-expanded]')
    // Contenu repliable (porte `hidden` quand la section est fermée)
    const isHidden = (form: Form) =>
      form.get('[data-details]').element.parentElement?.hasAttribute('hidden')

    it('est fermée par défaut pour une nouvelle trace', async () => {
      const form = await mountSuspended(TraceForm)

      expect(toggle(form).attributes('aria-expanded')).toBe('false')
      // Masquée mais présente (`hidden="until-found"`) : validée, trouvée par la recherche
      expect(isHidden(form)).toBe(true)
      expect(form.text()).toContain('Date de réalisation')
    })

    it('est ouverte d’emblée quand un de ses champs est renseigné', async () => {
      const form = await mountSuspended(TraceForm, {
        props: {
          initial: {
            titre: 'Affiche',
            description: null,
            contexte: null,
            legende: null,
            type: 'lien',
            contenu: [],
            statut: 'brouillon',
            conceptionIa: 'moyen',
            realisationIa: 'non_renseigne',
            dateRealisation: null,
          },
        },
      })

      expect(toggle(form).attributes('aria-expanded')).toBe('true')
      expect(isHidden(form)).toBe(false)
    })

    it('s’ouvre sur une erreur du serveur et place le focus sur le champ', async () => {
      const form = await mountSuspended(TraceForm, { attachTo: document.body })

      form.vm.setServerErrors([
        { propertyPath: 'dateRealisation', message: 'La date ne peut pas être dans le futur.' },
      ])

      await vi.waitFor(() => expect(isHidden(form)).toBe(false))
      await vi.waitFor(() =>
        expect(document.activeElement).toBe(form.get('input[name="dateRealisation"]').element),
      )
      form.unmount()
    })

    it('s’ouvre sur une erreur de validation et place le focus sur le champ', async () => {
      const form = await mountSuspended(TraceForm, { attachTo: document.body })

      await form.get('input[name="titre"]').setValue('Trace datée')
      await form.get('input[name="dateRealisation"]').setValue('2999-01-01')
      await submitWith(form, 'brouillon')

      await vi.waitFor(() => expect(isHidden(form)).toBe(false))
      await vi.waitFor(() =>
        expect(document.activeElement).toBe(form.get('input[name="dateRealisation"]').element),
      )
      expect(form.emitted('submit')).toBeUndefined()
      form.unmount()
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

  it('signale chaque modification avec la trace en cours de saisie', async () => {
    const form = await mountSuspended(TraceForm)

    await form.get('input[name="titre"]').setValue('Podcast')

    await vi.waitFor(() => expect(form.emitted('change')?.length).toBeGreaterThan(0))
    expect(form.emitted('change')?.at(-1)?.[0]).toMatchObject({
      titre: 'Podcast',
      statut: 'brouillon',
    })
  })

  // Relecture : passer d'Image à PDF gardait l'image (refusée ensuite par le serveur)
  it('ne garde pas le fichier d’un autre type quand on change de type', async () => {
    const form = await mountSuspended(TraceForm, {
      props: {
        initial: {
          titre: 'Affiche',
          description: null,
          contexte: null,
          legende: 'Affiche orange',
          type: 'image',
          contenu: ['/fichiers/affiche.jpg'],
          statut: 'brouillon',
          conceptionIa: 'aucun',
          realisationIa: 'aucun',
          dateRealisation: null,
        },
      },
    })
    expect(form.text()).toContain('affiche.jpg')

    // Sélecteur segmenté : de vrais boutons radio natifs
    await form.get('input[type="radio"][value="pdf"]').setValue()

    await vi.waitFor(() =>
      expect(form.emitted('change')?.at(-1)?.[0]).toMatchObject({ type: 'pdf', contenu: [] }),
    )
    expect(form.text()).not.toContain('affiche.jpg')
  })

  it('efface l’erreur du fichier dès qu’un fichier est déposé', async () => {
    const form = await mountSuspended(TraceForm, {
      props: {
        initial: {
          titre: 'Affiche',
          description: null,
          contexte: null,
          legende: 'Affiche orange',
          type: 'image',
          contenu: [],
          statut: 'brouillon',
          conceptionIa: 'aucun',
          realisationIa: 'aucun',
          dateRealisation: null,
        },
      },
    })
    form.vm.setServerErrors([{ propertyPath: 'contenu', message: 'Fichier manquant.' }])
    await vi.waitFor(() => expect(form.text()).toContain('Fichier manquant.'))

    form
      .findComponent({ name: 'TraceFileField' })
      .vm.$emit('update:modelValue', '/api/fichiers/0b7c1f0e-3a1d-4c55-9a52-2f0e8a9d1c11')

    await vi.waitFor(() => expect(form.text()).not.toContain('Fichier manquant.'))
  })

  it('ferme l’aperçu de la description quand le serveur la refuse, pour y mettre le focus', async () => {
    const form = await mountSuspended(TraceForm, { attachTo: document.body })
    await form.get('button[aria-pressed]').trigger('click')
    expect(form.find('[role="region"]').exists()).toBe(true)

    ;(form.vm as unknown as { setServerErrors: (v: unknown[]) => unknown }).setServerErrors([
      {
        propertyPath: 'description',
        message: 'La description ne doit pas dépasser 5 000 caractères.',
      },
    ])

    await vi.waitFor(() => expect(form.find('[role="region"]').exists()).toBe(false))
    await vi.waitFor(() => expect(document.activeElement).toBe(form.get('textarea').element))
    form.unmount()
  })
})
