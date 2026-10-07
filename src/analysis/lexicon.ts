import type { Lexicon } from './types'

let pending: Promise<Lexicon> | undefined

/** Lazily loads the CMU dictionary (~1MB gzipped) as its own chunk. */
export function loadLexicon(): Promise<Lexicon> {
  pending ??= import('cmu-pronouncing-dictionary').then(({ dictionary }) => {
    return (word: string) => (Object.hasOwn(dictionary, word) ? dictionary[word] : undefined)
  })
  return pending
}
