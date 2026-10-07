import type { Metrics } from './types'

const NUMBER_WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
]

const spell = (n: number) => NUMBER_WORDS[n] ?? String(n)
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const plural = (n: number, word: string) => `${spell(n)} ${word}${n === 1 ? '' : 's'}`

/** Variety (coefficient of variation) above this reads as a deliberately varied paragraph. */
const VARIED = 0.45
const MIN_RUN = 3

export const LENGTH_BINS = [
  { label: '1–4', min: 1, max: 4 },
  { label: '5–9', min: 5, max: 9 },
  { label: '10–17', min: 10, max: 17 },
  { label: '18–29', min: 18, max: 29 },
  { label: '30+', min: 30, max: Infinity },
] as const

export function lengthBin(words: number): number {
  return LENGTH_BINS.findIndex((bin) => words <= bin.max)
}

/** One plain-English sentence about the paragraph's rhythm. */
export function describeRhythm(metrics: Metrics): string {
  const { sentences, lengths, longestRun } = metrics
  if (sentences === 0) return ''
  if (sentences === 1) {
    return `One sentence of ${plural(lengths[0], 'word')}. Add another to hear a rhythm.`
  }

  if (longestRun.length >= MIN_RUN) {
    const run = lengths.slice(longestRun.start, longestRun.start + longestRun.length)
    const typical = Math.round(run.reduce((a, b) => a + b, 0) / run.length)
    if (longestRun.length === sentences) {
      return `Every sentence runs about ${plural(typical, 'word')}. Try one much shorter, or much longer.`
    }
    const breaks =
      longestRun.start + longestRun.length < sentences ? ' Then the rhythm breaks.' : ''
    return `${capitalize(spell(longestRun.length))} sentences in a row run about ${plural(typical, 'word')}.${breaks}`
  }

  if (metrics.variety >= VARIED) {
    return `Your sentences range from ${spell(Math.min(...lengths))} to ${plural(Math.max(...lengths), 'word')}.`
  }
  return `Most sentences sit near ${plural(Math.round(metrics.meanLength), 'word')}. Try a short one.`
}
