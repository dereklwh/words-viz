import { beforeAll, describe, expect, it } from 'vitest'
import { PROVOST } from './fixtures/provost'
import { loadLexicon } from './lexicon'
import { analyze } from './rhythm'
import type { Lexicon, Note, Rest, Score } from './types'

let lexicon: Lexicon
beforeAll(async () => {
  lexicon = await loadLexicon()
})

const notes = (score: Score, phrase = 0) =>
  score.phrases[phrase].events.filter((e): e is Note => e.kind === 'note')
const rests = (score: Score, phrase = 0) =>
  score.phrases[phrase].events.filter((e): e is Rest => e.kind === 'rest')

describe('Provost golden fixture', () => {
  it('hears nine five-word sentences, then music', () => {
    const { metrics } = analyze(PROVOST, lexicon)
    expect(metrics.lengths).toEqual([5, 5, 5, 5, 5, 5, 5, 5, 5, 2, 9, 1, 3, 9, 4, 7, 54])
    expect(metrics.sentences).toBe(17)
    expect(metrics.words).toBe(134)
    expect(metrics.longestRun).toEqual({ start: 0, length: 9 })
    expect(metrics.meanLength).toBeCloseTo(7.8824, 3)
    expect(metrics.stdevLength).toBeCloseTo(11.6966, 3)
    expect(metrics.variety).toBeCloseTo(1.4839, 3)
  })

  it('finds the rests in the crescendo', () => {
    const score = analyze(PROVOST, lexicon)
    const kinds = rests(score, 16).map((r) => r.rest)
    expect(kinds).toEqual(['comma', 'comma', 'comma', 'comma', 'comma', 'dash', 'comma', 'cadence'])
  })

  it('uses dictionary syllables', () => {
    const score = analyze('But several together become monotonous.', lexicon)
    expect(notes(score).map((n) => n.syllables)).toEqual([1, 2, 3, 2, 4])
    expect(score.phrases[0].syllables).toBe(12)
    expect(score.phrases[0].beats).toBe(6 + 2)
  })
})

describe('notes', () => {
  it('maps every note back to its source text', () => {
    const score = analyze(PROVOST, lexicon)
    for (const phrase of score.phrases) {
      expect(PROVOST.slice(phrase.start, phrase.end)).toBe(phrase.text)
      for (const n of phrase.events) {
        if (n.kind === 'note') expect(PROVOST.slice(n.start, n.end)).toBe(n.text)
      }
    }
  })

  it('ties hyphenated compounds', () => {
    const score = analyze('Five-word sentences are fine.', lexicon)
    expect(notes(score).map((n) => [n.text, n.tie])).toEqual([
      ['Five', false],
      ['word', true],
      ['sentences', false],
      ['are', false],
      ['fine', false],
    ])
    expect(rests(score)).toHaveLength(1)
  })

  it('accents the last content word of each intonation unit', () => {
    const score = analyze('I vary the sentence length, and I create music.', lexicon)
    expect(
      notes(score)
        .filter((n) => n.accent)
        .map((n) => n.text),
    ).toEqual(['length', 'music'])
  })
})

describe('rests and cadences', () => {
  it('rests inside dialogue and cadences on the attribution', () => {
    const score = analyze('“Stop!” she said.', lexicon)
    expect(score.phrases).toHaveLength(1)
    expect(rests(score).map((r) => [r.rest, r.mark])).toEqual([
      ['pause', '!'],
      ['cadence', '.'],
    ])
  })

  it('classifies punctuation as rests', () => {
    const score = analyze('Wait, no; stop — now… go.', lexicon)
    expect(rests(score).map((r) => [r.rest, r.mark, r.beats])).toEqual([
      ['comma', ',', 0.5],
      ['pause', ';', 1],
      ['dash', '—', 1],
      ['ellipsis', '…', 1.5],
      ['cadence', '.', 2],
    ])
  })

  it('resolves statements to the tonic', () => {
    const score = analyze('The writing sings.', lexicon)
    expect(score.phrases[0].cadence).toBe('full')
    expect(notes(score).at(-1)!.degree).toBe(0)
  })

  it('rises on questions', () => {
    const score = analyze('Is it really over?', lexicon)
    const [, , really, over] = notes(score)
    expect(score.phrases[0].cadence).toBe('question')
    expect(over.degree).toBeGreaterThanOrEqual(6)
    expect(over.degree).toBeGreaterThan(really.degree - 1)
  })

  it('peaks on exclamations and suspends on ellipses', () => {
    expect(analyze('Listen to this!', lexicon).phrases[0].cadence).toBe('exclamation')
    expect(notes(analyze('Listen to this!', lexicon)).at(-1)!.degree).toBe(7)
    expect(analyze('And then…', lexicon).phrases[0].cadence).toBe('trailing')
    expect(analyze('No punctuation here', lexicon).phrases[0].cadence).toBe('open')
  })

  it('keeps every degree on the scale', () => {
    for (const phrase of analyze(PROVOST, lexicon).phrases) {
      for (const n of phrase.events) {
        if (n.kind === 'note') expect(n.degree).toBeGreaterThanOrEqual(0)
        if (n.kind === 'note') expect(n.degree).toBeLessThanOrEqual(7)
      }
    }
  })
})

describe('without a lexicon', () => {
  it('falls back to heuristics', () => {
    const score = analyze('Music sings.')
    expect(notes(score).map((n) => [n.syllables, n.guessed])).toEqual([
      [2, true],
      [1, true],
    ])
  })

  it('handles empty input', () => {
    const score = analyze('   \n\n ')
    expect(score.phrases).toEqual([])
    expect(score.metrics.sentences).toBe(0)
    expect(score.metrics.variety).toBe(0)
    expect(score.metrics.longestRun).toEqual({ start: 0, length: 0 })
  })
})
