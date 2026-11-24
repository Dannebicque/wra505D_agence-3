import { describe, expect, it } from 'vitest'
import { applyMarkdownAction, type Selection } from '../../app/utils/markdown-edition'
import { isSafeLink, renderMarkdown } from '../../app/utils/markdown'

/** Texte obtenu après l'action, et texte sélectionné ensuite. */
function run(selection: Selection, action: Parameters<typeof applyMarkdownAction>[1]) {
  const edit = applyMarkdownAction(selection, action)
  const value = selection.value.slice(0, edit.start) + edit.text + selection.value.slice(edit.end)
  return { value, selected: value.slice(edit.selectionStart, edit.selectionEnd) }
}

describe('renderMarkdown', () => {
  it('rend le gras, l’italique, les listes et les retours à la ligne', () => {
    const html = renderMarkdown('**Fort** et _léger_\nligne suivante\n\n- un\n- deux\n\n1. premier')
    expect(html).toContain('<strong>Fort</strong>')
    expect(html).toContain('<em>léger</em>')
    expect(html).toContain('<br>')
    expect(html).toMatch(/<ul>\s*<li>un<\/li>\s*<li>deux<\/li>\s*<\/ul>/)
    expect(html).toMatch(/<ol>\s*<li>premier<\/li>\s*<\/ol>/)
  })

  it('rend un lien web, sans le suivre pour le référencement', () => {
    expect(renderMarkdown('[Site](https://exemple.fr)')).toContain(
      '<a href="https://exemple.fr" rel="nofollow ugc noopener">Site</a>',
    )
  })

  it.each([
    ['<script>alert(1)</script>', '<script'],
    ['<img src=x onerror="alert(1)">', '<img'],
    ['texte <b onclick="x()">gras</b>', '<b '],
  ])('échappe le HTML écrit par l’étudiant : %s', (source, interdit) => {
    const html = renderMarkdown(source)
    expect(html).not.toContain(interdit)
    expect(html).toContain('&lt;')
  })

  it.each([
    '[clic](javascript:alert(1))',
    '[clic](JaVaScRiPt:alert(1))',
    '[clic](data:text/html;base64,PHNjcmlwdD4=)',
    '<javascript:alert(1)>',
    '[x][1]\n\n[1]: <javascript:alert(1)> "t"',
    '[x](&#106;avascript:alert(1))',
    '[x]( javascript:alert(1))',
    // Adresse laissée incomplète après un clic sur « Lien »
    '[x](https://)',
  ])('ne crée pas de lien dangereux ou vide : %s', (source) => {
    const html = renderMarkdown(source)
    expect(html).not.toContain('<a ')
    expect(html.toLowerCase()).not.toContain('href="javascript')
  })

  it('échappe les guillemets d’une adresse (pas d’attribut injecté)', () => {
    const html = renderMarkdown('[x](https://a.fr/"onmouseover="alert(1))')
    expect(html).not.toMatch(/"\s*onmouseover=/)
  })

  it('place les titres sous celui de l’endroit où la description s’affiche', () => {
    const source = '# Titre\n\n## Sous-titre\n\n#### Plus bas'
    expect(renderMarkdown(source)).toBe(
      '<h3 data-titre="1">Titre</h3>\n<h4 data-titre="2">Sous-titre</h4>\n<h4 data-titre="2">Plus bas</h4>\n',
    )
    expect(renderMarkdown('# Titre', { headingLevel: 4 })).toBe('<h4 data-titre="1">Titre</h4>\n')
    // Jamais au-delà de h6
    expect(renderMarkdown('## Bas', { headingLevel: 6 })).toBe('<h6 data-titre="2">Bas</h6>\n')
  })

  it('échappe le HTML écrit dans un titre', () => {
    expect(renderMarkdown('# <script>x</script>')).not.toContain('<script')
  })

  it('n’affiche pas de titre vide (préfixe posé par la barre puis laissé)', () => {
    expect(renderMarkdown('# \n\nTexte')).toBe('<p>Texte</p>\n')
    expect(renderMarkdown('##')).toBe('')
  })

  it('laisse en paragraphe une ligne soulignée (seuls # et ## font un titre)', () => {
    expect(renderMarkdown('Ligne\n---')).toBe('<p>Ligne</p>\n')
    expect(renderMarkdown('Titre\n===')).toBe('<p>Titre</p>\n')
  })

  it('rend les images en texte', () => {
    const html = renderMarkdown('![Affiche du festival](https://a.fr/i.png)')
    expect(html).not.toContain('<img')
    expect(html).toContain('Affiche du festival')
  })

  it.each([
    ['- [ ] tâche', '<input'],
    ['    paragraphe collé avec un retrait', '<pre'],
    ['| a | b |\n|---|---|\n| 1 | 2 |', '<table'],
    ['> cité', '<blockquote'],
    ['avant\n\n---\n\naprès', '<hr'],
    ['~~barré~~', '<del'],
  ])('affiche en texte ce qui sort du sous-ensemble : %s', (source, balise) => {
    expect(renderMarkdown(source)).not.toContain(balise)
  })

  it('garde en texte ce qui est coché dans une liste de tâches', () => {
    const html = renderMarkdown('- [x] fait\n- [ ] à faire')
    expect(html).toContain('[x] fait')
    expect(html).toContain('[ ] à faire')
  })

  it('garde le texte d’un paragraphe collé avec un retrait, avec ses retours à la ligne', () => {
    expect(renderMarkdown('    ligne un\n    ligne deux')).toBe('<p>ligne un<br>ligne deux</p>\n')
  })

  it('renvoie une chaîne vide pour une description vide', () => {
    expect(renderMarkdown(null)).toBe('')
    expect(renderMarkdown('   \n')).toBe('')
  })

  it('n’accepte que les liens web et courriel', () => {
    expect(isSafeLink('https://a.fr')).toBe(true)
    expect(isSafeLink('mailto:a@b.fr')).toBe(true)
    expect(isSafeLink('https://')).toBe(false)
    expect(isSafeLink('/etudiant')).toBe(false)
    expect(isSafeLink('vbscript:x')).toBe(false)
  })
})

describe('applyMarkdownAction', () => {
  it('met la sélection en gras, puis l’en retire', () => {
    const bold = run({ value: 'un mot ici', start: 3, end: 6 }, 'bold')
    expect(bold).toEqual({ value: 'un **mot** ici', selected: 'mot' })
    const back = run({ value: 'un **mot** ici', start: 5, end: 8 }, 'bold')
    expect(back).toEqual({ value: 'un mot ici', selected: 'mot' })
  })

  it('retire le gras d’une sélection qui comprend ses marques', () => {
    expect(run({ value: 'un **mot** ici', start: 3, end: 10 }, 'bold')).toEqual({
      value: 'un mot ici',
      selected: 'mot',
    })
  })

  it('laisse hors des marques l’espace pris par un double-clic', () => {
    expect(run({ value: 'un mot ici', start: 3, end: 7 }, 'bold').value).toBe('un **mot** ici')
  })

  it('sans sélection, insère un exemple sélectionné, prêt à être remplacé', () => {
    expect(run({ value: 'Avant ', start: 6, end: 6 }, 'italic')).toEqual({
      value: 'Avant *texte en italique*',
      selected: 'texte en italique',
    })
  })

  it('met en italique au milieu d’un mot (astérisques)', () => {
    expect(run({ value: 'motclé', start: 1, end: 3 }, 'italic').value).toBe('m*ot*clé')
  })

  it('transforme les lignes touchées en liste à puces, puis les rétablit', () => {
    const value = 'Intro\nun\ndeux'
    const list = run({ value, start: 7, end: 10 }, 'bullets')
    expect(list.value).toBe('Intro\n- un\n- deux')
    expect(run({ value: list.value, start: 8, end: 14 }, 'bullets').value).toBe(value)
  })

  it('numérote les lignes, en remplaçant des puces existantes', () => {
    expect(run({ value: '- un\n- deux', start: 0, end: 11 }, 'numbers').value).toBe(
      '1. un\n2. deux',
    )
  })

  it('liste sans plage inversée quand le texte commence par une ligne vide', () => {
    const edit = applyMarkdownAction({ value: '\nabc', start: 0, end: 0 }, 'bullets')
    expect(edit.start).toBeLessThanOrEqual(edit.end)
    expect(run({ value: '\nabc', start: 0, end: 0 }, 'bullets').value).toBe('- \nabc')
  })

  it.each([
    ['', 0, 'bullets', '- '],
    ['', 0, 'numbers', '1. '],
    ['abc\n', 4, 'bullets', 'abc\n- '],
  ] as const)('commence une liste sur une ligne vide : %j', (value, cursor, action, attendu) => {
    const edit = applyMarkdownAction({ value, start: cursor, end: cursor }, action)
    expect(run({ value, start: cursor, end: cursor }, action).value).toBe(attendu)
    // Le curseur suit le préfixe, prêt pour la saisie
    expect(edit.selectionStart).toBe(edit.selectionEnd)
    expect(edit.selectionStart).toBe(attendu.length)
  })

  it.each([
    // [texte, début, fin, action, résultat]
    ['**mot**', 2, 5, 'italic', '***mot***'],
    ['*mot*', 1, 4, 'bold', '***mot***'],
    ['***mot***', 3, 6, 'italic', '**mot**'],
    ['***mot***', 3, 6, 'bold', '*mot*'],
    ['**mot**', 0, 7, 'italic', '_**mot**_'],
    ['*mot*', 0, 5, 'italic', 'mot'],
  ] as const)(
    'combine gras et italique sans perdre l’un ou l’autre : %s',
    (value, start, end, action, attendu) => {
      expect(run({ value, start, end }, action).value).toBe(attendu)
    },
  )

  it.each([
    // [texte, début, fin, action, résultat]
    ['**mot**s', 2, 5, 'bold', 'mots'],
    ['in**croyable**', 4, 12, 'bold', 'incroyable'],
    ['_mot_', 1, 4, 'italic', 'mot'],
    ['2*_3_*4', 3, 4, 'italic', '2*3*4'],
    // `2*3*4` se lit déjà « 2, 3 en italique, 4 » : l'italique est retiré
    ['2*3*4', 2, 3, 'italic', '234'],
  ] as const)(
    'retire la mise en forme, même collée à un mot : %s',
    (value, start, end, action, attendu) => {
      expect(run({ value, start, end }, action).value).toBe(attendu)
    },
  )

  it.each([
    // [texte, début, fin, action, rendu attendu]
    [
      '- un\n- deux',
      0,
      11,
      'bold',
      '<ul>\n<li><strong>un</strong></li>\n<li><strong>deux</strong></li>\n</ul>\n',
    ],
    [
      '1. un\n2. deux',
      3,
      13,
      'italic',
      '<ol>\n<li><em>un</em></li>\n<li><em>deux</em></li>\n</ol>\n',
    ],
    ['para\n\npara', 0, 10, 'bold', '<p><strong>para</strong></p>\n<p><strong>para</strong></p>\n'],
    ['- **a**', 0, 7, 'bold', '<ul>\n<li>a</li>\n</ul>\n'],
  ] as const)(
    'met en forme ligne par ligne, puces hors des marques : %j',
    (value, start, end, action, rendu) => {
      expect(renderMarkdown(run({ value, start, end }, action).value)).toBe(rendu)
    },
  )

  it.each([
    ['un mot', 3, 6],
    ['- un\n- deux', 0, 11],
    ['para\n\npara', 0, 10],
    ['- un mot ici', 5, 8],
    ['**mot**', 2, 5],
    ['**mot**', 0, 7],
    ['*a* et *b*', 0, 10],
    ['**gras**mot', 8, 11],
    ['**mot**s', 2, 5],
  ] as const)('revient au texte de départ après deux clics : %s', (value, start, end) => {
    for (const action of ['bold', 'italic'] as const) {
      const first = applyMarkdownAction({ value, start, end }, action)
      const once = value.slice(0, first.start) + first.text + value.slice(first.end)
      const second = applyMarkdownAction(
        { value: once, start: first.selectionStart, end: first.selectionEnd },
        action,
      )
      const twice = once.slice(0, second.start) + second.text + once.slice(second.end)
      expect(twice, `${action} deux fois`).toBe(value)
    }
  })

  it.each([
    // [texte, début, fin, action, rendu attendu]
    ['*a* et *b*', 0, 10, 'italic', '<em><em>a</em> et <em>b</em></em>'],
    ['**a** et **b**', 0, 14, 'bold', '<strong><strong>a</strong> et <strong>b</strong></strong>'],
    ['**gras**mot', 8, 11, 'bold', '<strong>gras</strong><strong>mot</strong>'],
    ['2*3*4', 2, 3, 'bold', '2<em><strong>3</strong></em>4'],
    ['**mot**s', 2, 5, 'italic', '<em><strong>mot</strong></em>s'],
    ['x**mot**', 3, 6, 'italic', 'x<em><strong>mot</strong></em>'],
  ] as const)(
    'garde une syntaxe valide quand la sélection touche d’autres astérisques : %s',
    (value, start, end, action, rendu) => {
      const result = run({ value, start, end }, action).value
      expect(renderMarkdown(result)).toBe(`<p>${rendu}</p>\n`)
    },
  )

  it('ne prend pas la ligne suivante quand la sélection finit sur un saut de ligne', () => {
    expect(run({ value: 'a\nb\nc', start: 0, end: 2 }, 'bullets').value).toBe('- a\nb\nc')
  })

  it('saute les lignes vides et numérote les autres à la suite', () => {
    expect(run({ value: 'un\n\ndeux', start: 0, end: 8 }, 'numbers').value).toBe('1. un\n\n2. deux')
  })

  it('garde le retrait d’une liste imbriquée', () => {
    expect(run({ value: '  imbriqué', start: 0, end: 10 }, 'bullets').value).toBe('  - imbriqué')
  })

  it('fait de la ligne du curseur un titre, puis la rétablit', () => {
    const value = 'Intro\nContexte du projet\nsuite'
    const heading = run({ value, start: 10, end: 10 }, 'heading')
    expect(heading.value).toBe('Intro\n# Contexte du projet\nsuite')
    expect(run({ value: heading.value, start: 12, end: 12 }, 'heading').value).toBe(value)
  })

  it('passe d’un titre à un sous-titre sans cumuler les dièses', () => {
    expect(run({ value: '# Résultats', start: 3, end: 3 }, 'subheading').value).toBe('## Résultats')
  })

  it('pose un titre sur une ligne vide, curseur après le préfixe', () => {
    const edit = applyMarkdownAction({ value: '', start: 0, end: 0 }, 'subheading')
    expect(edit.text).toBe('## ')
    expect(edit.selectionStart).toBe(3)
  })

  it('retire la puce d’une ligne transformée en titre', () => {
    expect(run({ value: '- Bilan', start: 0, end: 7 }, 'heading').value).toBe('# Bilan')
  })

  it('retire le titre d’une ligne passée en liste', () => {
    expect(run({ value: '# un\n## deux', start: 0, end: 12 }, 'bullets').value).toBe('- un\n- deux')
  })

  it('laisse le dièse d’un titre hors du gras', () => {
    const value = '# Bilan'
    expect(run({ value, start: 0, end: value.length }, 'bold').value).toBe('# **Bilan**')
  })

  it('met plusieurs lignes en titre puis les rétablit, lignes vides comprises', () => {
    const value = 'Un\n\nDeux\n'
    const titles = run({ value, start: 0, end: value.length }, 'subheading')
    expect(titles.value).toBe('## Un\n\n## Deux\n')
    expect(
      run({ value: titles.value, start: 0, end: titles.value.length }, 'subheading').value,
    ).toBe(value)
  })
})
