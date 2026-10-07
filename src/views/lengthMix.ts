import type { Score } from '../analysis'
import { LENGTH_BINS, lengthBin } from '../analysis/insights'
import { excerpt, orderedNotes, type Targets, type ViewLayout } from './types'

export interface MixDot {
  phrase: number
  text: string
  bin: number
  words: number
  cx: number
  cy: number
  r: number
  lastOrder: number
}

export interface MixRow {
  name: string
  range: string
  top: number
  centerY: number
  count: number
  countX: number
}

export interface LengthMixLayout extends ViewLayout {
  labelWidth: number
  dots: MixDot[]
  rows: MixRow[]
}

const TOP = 8
const BOTTOM = 8
const ROW_HEIGHT = 36
const COUNT_WIDTH = 32

/** One row per length band, a dot per sentence, read left to right like a tally. */
export function layoutLengthMix(score: Score, width: number): LengthMixLayout {
  const narrow = width < 560
  const labelWidth = narrow ? 84 : 120
  const r = narrow ? 7 : 9
  const step = r * 2 + 5
  const perLine = Math.max(1, Math.floor((width - labelWidth - COUNT_WIDTH) / step))
  const binOf = score.phrases.map((p) => lengthBin(p.words))

  let top = TOP
  const rows: MixRow[] = LENGTH_BINS.map((bin, b) => {
    const count = binOf.filter((x) => x === b).length
    const lines = Math.max(1, Math.ceil(count / perLine))
    const row = {
      name: bin.name,
      range: `${bin.label} words`,
      top,
      centerY: top + ROW_HEIGHT / 2,
      count,
      countX: labelWidth + Math.min(count, perLine) * step + 6,
    }
    top += ROW_HEIGHT + (lines - 1) * step
    return row
  })

  const notes = orderedNotes(score)
  const filled = LENGTH_BINS.map(() => 0)
  const targets: Targets = {}
  const dots: MixDot[] = score.phrases.map((phrase, i) => {
    const bin = binOf[i]
    const k = filled[bin]++
    const own = notes.filter((n) => n.phrase === phrase.index)
    const dot: MixDot = {
      phrase: phrase.index,
      text: excerpt(phrase.text),
      bin,
      words: phrase.words,
      cx: labelWidth + r + (k % perLine) * step,
      cy: rows[bin].centerY + Math.floor(k / perLine) * step,
      r,
      lastOrder: own.at(-1)?.order ?? 0,
    }
    for (const n of own) targets[n.key] = [dot.cx, dot.cy]
    return dot
  })

  return { width, height: top + BOTTOM, targets, labelWidth, dots, rows }
}
