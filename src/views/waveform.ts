import type { Score } from '../analysis'
import { noteKey } from '../score/layout'
import { orderedNotes, type OrderedNote, type Targets, type ViewLayout } from './types'

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
const AMPLITUDE = 34
const ROW_GAP = 24
const MIN_UNIT = 4
const MAX_UNIT = 12
const BAR_RATIO = 0.5
/** Silence after a rest, in bar widths per beat. */
const REST_UNITS_PER_BEAT = 1.5
const PARAGRAPH_UNITS = 2

type Item = { kind: 'bar'; ref: OrderedNote } | { kind: 'gap'; units: number }

export function layoutWaveform(score: Score, width: number): WaveformLayout {
  const notes = orderedNotes(score)
  const byKey = new Map(notes.map((n) => [n.key, n]))
  const items: Item[] = []
  score.phrases.forEach((phrase, p) => {
    phrase.events.forEach((event, i) => {
      if (event.kind === 'note')
        items.push({ kind: 'bar', ref: byKey.get(noteKey(phrase.index, i))! })
      else items.push({ kind: 'gap', units: event.beats * REST_UNITS_PER_BEAT })
    })
    if (phrase.endsParagraph && p < score.phrases.length - 1)
      items.push({ kind: 'gap', units: PARAGRAPH_UNITS })
  })

  const totalUnits = items.reduce((a, it) => a + (it.kind === 'bar' ? 1 : it.units), 0)
  const unit = totalUnits ? Math.min(MAX_UNIT, Math.max(MIN_UNIT, width / totalUnits)) : MAX_UNIT
  const maxSyllables = Math.max(1, ...notes.map((n) => n.note.syllables))
  const rowHeight = AMPLITUDE * 2 + ROW_GAP
  const rows: WaveformLayout['rows'] = [{ y: TOP + AMPLITUDE, end: 0 }]
  const bars: WaveBar[] = []
  const targets: Targets = {}
  let cursor = 0

  for (const item of items) {
    const advance = item.kind === 'bar' ? unit : item.units * unit
    if (cursor + advance > width && cursor > 0) {
      if (item.kind === 'gap') continue
      rows.push({ y: TOP + AMPLITUDE + rows.length * rowHeight, end: 0 })
      cursor = 0
    }
    const row = rows.at(-1)!
    if (item.kind === 'bar') {
      const { key, phrase, note, order } = item.ref
      const bar: WaveBar = {
        key,
        phrase,
        text: note.text,
        syllables: note.syllables,
        x: cursor + (unit * (1 - BAR_RATIO)) / 2,
        width: unit * BAR_RATIO,
        y: row.y,
        amplitude: Math.max(3, (note.syllables / maxSyllables) * AMPLITUDE),
        faint: note.isFunctionWord,
        accent: note.accent,
        order,
      }
      bars.push(bar)
      targets[key] = [bar.x + bar.width / 2, row.y]
    }
    cursor += advance
    row.end = cursor
  }

  return {
    width,
    height: TOP + rows.length * rowHeight - ROW_GAP + BOTTOM,
    targets,
    rows,
    bars,
  }
}
