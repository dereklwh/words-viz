import type { Score } from '../analysis'
import { noteKey } from '../score/layout'
import { orderedNotes, type Targets, type ViewLayout } from './types'

export interface WaveBar {
  key: string
  phrase: number
  text: string
  syllables: number
  x: number
  width: number
  /** Center line of the bar's row. */
  y: number
  amplitude: number
  faint: boolean
  accent: boolean
  order: number
}

export interface WaveformLayout extends ViewLayout {
  rows: { y: number; end: number }[]
  bars: WaveBar[]
}

const TOP = 12
const BOTTOM = 12
const AMPLITUDE = 40
const ROW_GAP = 28
const SYLLABLE_GAP = 2
const PARAGRAPH_GAP = 24
/** Spoken weight: primary stress full height, secondary lighter, unstressed low. */
const STRESS_HEIGHT = [0.3, 1, 0.62]
const FUNCTION_WORD_HEIGHT = 0.22

function metrics(width: number) {
  const bar = width < 560 ? 4 : 5
  return { bar, step: bar + SYLLABLE_GAP, wordGap: bar + 4, restPerBeat: width < 560 ? 8 : 12 }
}

/** One bar per syllable, so stressed syllables stand tall: the da-DUM of the prose. */
export function layoutWaveform(score: Score, width: number): WaveformLayout {
  const { bar, step, wordGap, restPerBeat } = metrics(width)
  const notes = new Map(orderedNotes(score).map((n) => [n.key, n]))
  const rowHeight = AMPLITUDE * 2 + ROW_GAP
  const rows: WaveformLayout['rows'] = [{ y: TOP + AMPLITUDE, end: 0 }]
  const bars: WaveBar[] = []
  const targets: Targets = {}
  let cursor = 0
  let afterWord = false

  score.phrases.forEach((phrase, p) => {
    phrase.events.forEach((event, i) => {
      const row = rows.at(-1)!
      if (event.kind === 'rest') {
        if (cursor > 0) cursor += event.beats * restPerBeat
        afterWord = false
        row.end = Math.min(width, cursor)
        return
      }
      const span = event.syllables * step - SYLLABLE_GAP
      let start = cursor + (afterWord ? wordGap : 0)
      if (start + span > width && cursor > 0) {
        rows.push({ y: TOP + AMPLITUDE + rows.length * rowHeight, end: 0 })
        start = 0
      }
      const current = rows.at(-1)!
      const { key, order } = notes.get(noteKey(phrase.index, i))!
      event.stress.forEach((stress, s) => {
        const weight = event.isFunctionWord ? FUNCTION_WORD_HEIGHT : STRESS_HEIGHT[stress]
        bars.push({
          key,
          phrase: phrase.index,
          text: event.text,
          syllables: event.syllables,
          x: start + s * step,
          width: bar,
          y: current.y,
          amplitude: Math.max(3, weight * AMPLITUDE),
          faint: event.isFunctionWord,
          accent: event.accent,
          order,
        })
      })
      targets[key] = [start + span / 2, current.y]
      cursor = start + span
      current.end = cursor
      afterWord = true
    })
    if (phrase.endsParagraph && p < score.phrases.length - 1 && cursor > 0) cursor += PARAGRAPH_GAP
  })

  return {
    width,
    height: TOP + rows.length * rowHeight - ROW_GAP + BOTTOM,
    targets,
    rows,
    bars,
  }
}
