import { computeMetrics } from './metrics'
import { pronounce } from './prosody'
import { segmentSentences, type SentenceSpan } from './segment'
import type { Cadence, Lexicon, Note, Phrase, Rest, RestKind, Score, ScoreEvent } from './types'

const BEATS_PER_SYLLABLE = 0.5
const REST_BEATS: Record<RestKind, number> = { comma: 0.5, pause: 1, dash: 1, ellipsis: 1.5 }
const CADENCE_BEATS: Record<Cadence, number> = {
  full: 2,
  question: 2,
  exclamation: 2,
  trailing: 2,
  open: 1,
}
const TOP_DEGREE = 7

const stripMark = (gap: string) => gap.replace(/[\s"'“”‘’()[\]{}]/g, '')

function classifyGap(gap: string): RestKind | undefined {
  if (!stripMark(gap)) return undefined
  if (/[—–]|--|\s-\s/.test(gap)) return 'dash'
  if (/…|\.\.\./.test(gap)) return 'ellipsis'
  if (/[;:?!]/.test(gap)) return 'pause'
  if (/,/.test(gap)) return 'comma'
  return undefined
}

function classifyCadence(trailing: string): Cadence {
  if (trailing.includes('?')) return 'question'
  if (trailing.includes('!')) return 'exclamation'
  if (/…|\.\.\./.test(trailing)) return 'trailing'
  if (trailing.includes('.')) return 'full'
  return 'open'
}

/**
 * Intonation: a baseline that declines across the sentence, content words lifted above it,
 * the nucleus of each intonation unit accented, and the cadence shaping the final note.
 */
function assignPitch(events: ScoreEvent[], cadence: Cadence): void {
  const notes = events.filter((e): e is Note => e.kind === 'note')
  const noteBeats = notes.reduce((a, n) => a + n.beats, 0)

  let unitNucleus: Note | undefined
  for (const event of events) {
    if (event.kind === 'rest') {
      if (unitNucleus) unitNucleus.accent = true
      unitNucleus = undefined
    } else if (!event.isFunctionWord) {
      unitNucleus = event
    }
  }
  if (unitNucleus) unitNucleus.accent = true

  let elapsed = 0
  for (const note of notes) {
    const baseline = 4 - 2 * (noteBeats ? elapsed / noteBeats : 0)
    const lift = note.isFunctionWord ? 0 : 2
    note.degree = clampDegree(baseline + lift + (note.accent ? 1 : 0))
    elapsed += note.beats
  }

  const last = notes.at(-1)
  if (!last) return
  if (cadence === 'full') last.degree = 0
  else if (cadence === 'question') last.degree = clampDegree(Math.max(last.degree + 2, 6))
  else if (cadence === 'exclamation') last.degree = TOP_DEGREE
  else if (cadence === 'trailing') last.degree = 3
}

function clampDegree(value: number): number {
  return Math.min(TOP_DEGREE, Math.max(0, Math.round(value)))
}

function buildPhrase(
  text: string,
  sentence: SentenceSpan,
  index: number,
  lexicon?: Lexicon,
): Phrase {
  const events: ScoreEvent[] = []
  let syllables = 0

  sentence.words.forEach((word, i) => {
    const restKind = i > 0 ? classifyGap(word.gapBefore) : undefined
    if (restKind) {
      const gapStart = word.start - word.gapBefore.length
      events.push({
        kind: 'rest',
        rest: restKind,
        mark: stripMark(word.gapBefore),
        beats: REST_BEATS[restKind],
        start: gapStart,
        end: word.start,
      })
    }
    const p = pronounce(word.text, lexicon)
    syllables += p.syllables
    events.push({
      kind: 'note',
      text: word.text,
      start: word.start,
      end: word.end,
      ...p,
      tie: i > 0 && /^[-‐]$/.test(word.gapBefore),
      accent: false,
      beats: p.syllables * BEATS_PER_SYLLABLE,
      degree: 0,
    })
  })

  const cadence = classifyCadence(sentence.trailing)
  const lastWordEnd = sentence.words.at(-1)!.end
  const cadenceRest: Rest = {
    kind: 'rest',
    rest: 'cadence',
    mark: stripMark(sentence.trailing),
    beats: CADENCE_BEATS[cadence],
    start: lastWordEnd,
    end: lastWordEnd + sentence.trailing.length,
  }
  events.push(cadenceRest)
  assignPitch(events, cadence)

  return {
    index,
    text: text.slice(sentence.start, sentence.end),
    start: sentence.start,
    end: sentence.end,
    events,
    words: sentence.words.length,
    syllables,
    beats: events.reduce((a, e) => a + e.beats, 0),
    cadence,
    endsParagraph: sentence.endsParagraph,
  }
}

/** Pass a lexicon from `loadLexicon()` for dictionary pronunciations; heuristics otherwise. */
export function analyze(text: string, lexicon?: Lexicon): Score {
  const phrases = segmentSentences(text).map((s, i) => buildPhrase(text, s, i, lexicon))
  return { text, phrases, metrics: computeMetrics(phrases) }
}
