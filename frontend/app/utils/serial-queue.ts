// File d'enregistrements exécutés un par un. Logique pure (sans Vue ni Nuxt) : testable dans `unit`.
//
// Sert aux listes réordonnables (pages d'un portfolio, traces d'une page) : chaque déplacement
// déclenche un enregistrement, mais deux requêtes ne partent jamais en même temps (la seconde
// pourrait arriver avant la première et laisser un ordre périmé sur le serveur).

export interface SerialQueue {
  /** Ajoute une tâche en fin de file ; la promesse suit son résultat. */
  run<T>(task: () => Promise<T>): Promise<T>
  /**
   * Comme `run`, mais une tâche de même clé encore en attente (pas commencée) n'est pas dupliquée :
   * l'appel renvoie sa promesse. La tâche lit l'état au moment où elle démarre, donc la dernière
   * modification est enregistrée en un seul envoi, quel que soit le nombre de déplacements.
   */
  runLatest(key: string, task: () => Promise<void>): Promise<void>
  /** Se résout quand la file est vide (les échecs ne la bloquent pas). */
  idle(): Promise<void>
}

export function createSerialQueue(): SerialQueue {
  let tail: Promise<unknown> = Promise.resolve()
  const waiting = new Map<string, Promise<void>>()

  function run<T>(task: () => Promise<T>): Promise<T> {
    const result = tail.then(task)
    // Un échec est rendu à l'appelant, mais la tâche suivante démarre quand même
    tail = result.catch(() => undefined)
    return result
  }

  function runLatest(key: string, task: () => Promise<void>): Promise<void> {
    const queued = waiting.get(key)
    if (queued) return queued
    const result = run(() => {
      // Démarrée : un nouvel appel doit se mettre derrière elle
      waiting.delete(key)
      return task()
    })
    waiting.set(key, result)
    return result
  }

  return {
    run,
    runLatest,
    idle: () => tail.then(() => undefined),
  }
}
