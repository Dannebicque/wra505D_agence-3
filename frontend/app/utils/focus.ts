/**
 * Garde l'élément qui a le focus, pour le lui rendre si l'action qu'il lance échoue : pendant
 * l'appel, ce bouton est désactivé (chargement, `UForm` en cours d'envoi) et un élément désactivé
 * perd le focus, qui retombe en haut de la page. Rendu au tour suivant, une fois l'élément
 * réactivé, et seulement si le focus n'est pas allé ailleurs entre-temps.
 */
export function captureFocus(): () => void {
  const element = import.meta.client ? document.activeElement : null
  return () => {
    if (!(element instanceof HTMLElement)) return
    setTimeout(() => {
      const current = document.activeElement
      if (element.isConnected && (!current || current === document.body)) element.focus()
    })
  }
}
