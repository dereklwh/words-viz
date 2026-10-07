import { syllable } from 'syllable'
import type { Lexicon, Stress } from './types'

export interface Pronunciation {
  syllables: number
  stress: Stress[]
  isFunctionWord: boolean
  guessed: boolean
}

const FUNCTION_WORDS = new Set(
  `a an the and but or nor so yet for if as than that this these those
  of to in on at by with from into onto upon over under about after before between through during without
  i me my mine you your yours he him his she her hers it its we us our ours they them their theirs
  who whom whose which what there here
  am is are was were be been being do does did have has had will would shall should can could may might must
  not no just very
  i'm i've i'll i'd you're you've you'll he's she's it's we're we've they're they've isn't aren't wasn't
  don't doesn't didn't can't won't`.split(/\s+/),
)

export function isFunctionWord(word: string): boolean {
  return FUNCTION_WORDS.has(normalizeWord(word))
}

export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[’‘]/g, "'")
}

function stressFromArpabet(phonemes: string): Stress[] {
  return phonemes
    .split(' ')
    .filter((ph) => /\d$/.test(ph))
    .map((ph) => Number(ph.at(-1)) as Stress)
}

function guessStress(syllables: number): Stress[] {
  const stress: Stress[] = Array(syllables).fill(0)
  stress[syllables >= 3 ? syllables - 3 : 0] = 1
  return stress
}

function lookup(word: string, lexicon: Lexicon | undefined): string | undefined {
  if (!lexicon) return undefined
  return lexicon(word) ?? lexicon(word.replace(/'s$|s'$|'$/, ''))
}

function guessSyllables(word: string): number {
  if (/^[\d,.]+/.test(word)) return Math.max(1, word.replace(/\D/g, '').length)
  return Math.max(1, syllable(word))
}

export function pronounce(raw: string, lexicon?: Lexicon): Pronunciation {
  const word = normalizeWord(raw)
  const isFunctionWord = FUNCTION_WORDS.has(word)
  const phonemes = lookup(word, lexicon)
  const fromDict = phonemes ? stressFromArpabet(phonemes) : []

  const guessed = fromDict.length === 0
  const stress = guessed ? guessStress(guessSyllables(word)) : fromDict
  // CMU stresses monosyllabic function words ("of" AH1); in running speech they're reduced.
  return {
    syllables: stress.length,
    stress: isFunctionWord ? stress.map(() => 0 as Stress) : stress,
    isFunctionWord,
    guessed,
  }
}
