import { computeMetrics } from '../analysis/metrics'
import type { Note, Phrase, Rest, RestKind, Score, ScoreEvent } from '../analysis'

interface NoteOptions {
  syllables?: number
  degree?: number
  functionWord?: boolean
  accent?: boolean
}

export const note = (text: string, options: NoteOptions = {}): Note => {
  const syllables = options.syllables ?? 1
  return {
    kind: 'note',
    text,
    start: 0,
    end: 0,
    syllables,
    stress: Array(syllables).fill(options.functionWord ? 0 : 1),
    isFunctionWord: options.functionWord ?? false,
    guessed: false,
    tie: false,
    accent: options.accent ?? false,
    beats: syllables / 2,
    degree: options.degree ?? 0,
  }
}

export const rest = (beats: number, kind: RestKind | 'cadence' = 'cadence'): Rest => ({
  kind: 'rest',
  rest: kind,
  mark: '.',
  beats,
  start: 0,
  end: 0,
})

export const phrase = (index: number, events: ScoreEvent[], endsParagraph = false): Phrase => {
  const notes = events.filter((e): e is Note => e.kind === 'note')
  return {
    index,
    text: '',
    start: 0,
    end: 0,
    events,
    words: notes.length,
    syllables: notes.reduce((a, n) => a + n.syllables, 0),
    beats: events.reduce((a, e) => a + e.beats, 0),
    cadence: 'full',
    endsParagraph,
  }
}

/** A sentence of `words` one-syllable notes and a full cadence. */
export const sentence = (index: number, words: number): Phrase =>
  phrase(index, [...Array.from({ length: words }, (_, i) => note(`w${i}`)), rest(2)])

export const score = (...phrases: Phrase[]): Score => ({
  text: '',
  phrases,
  metrics: computeMetrics(phrases),
})
