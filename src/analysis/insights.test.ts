import { beforeAll, describe, expect, it } from 'vitest'
import { PROVOST } from './fixtures/provost'
import { describeRhythm, lengthBin } from './insights'
import { loadLexicon } from './lexicon'
import { computeMetrics } from './metrics'
import { analyze } from './rhythm'
import type { Lexicon, Phrase } from './types'

let lexicon: Lexicon
beforeAll(async () => {
  lexicon = await loadLexicon()
})

const metricsOf = (lengths: number[]) =>
  computeMetrics(lengths.map((words) => ({ words, syllables: words, beats: words }) as Phrase))

describe('describeRhythm', () => {
  it('names the drone in Provost', () => {
    expect(describeRhythm(analyze(PROVOST, lexicon).metrics)).toBe(
      'Nine sentences in a row run about five words. Then the rhythm breaks.',
    )
  })

  it('calls out an unbroken drone', () => {
    expect(describeRhythm(metricsOf([12, 12, 13]))).toBe(
      'Every sentence runs about twelve words. Try one much shorter, or much longer.',
    )
  })

  it('praises range when sentences vary', () => {
    expect(describeRhythm(metricsOf([3, 20, 8, 41]))).toBe(
      'Your sentences range from three to 41 words.',
    )
  })

  it('nudges a flat but unruly paragraph', () => {
    expect(describeRhythm(metricsOf([20, 16, 24, 19]))).toBe(
      'Most sentences sit near 20 words. Try a short one.',
    )
  })

  it('handles one sentence and none', () => {
    expect(describeRhythm(metricsOf([1]))).toBe(
      'One sentence of one word. Add another to hear a rhythm.',
    )
    expect(describeRhythm(metricsOf([]))).toBe('')
  })
})

describe('lengthBin', () => {
  it('bins sentence lengths', () => {
    expect([1, 4, 5, 9, 10, 17, 18, 29, 30, 54].map(lengthBin)).toEqual([
      0, 0, 1, 1, 2, 2, 3, 3, 4, 4,
    ])
  })
})
