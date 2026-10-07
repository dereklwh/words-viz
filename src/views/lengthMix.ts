import type { Score } from '../analysis'
import { LENGTH_BINS, lengthBin } from '../analysis/insights'
import { orderedNotes, type Targets, type ViewLayout } from './types'

export interface MixDot {
  phrase: number
  bin: number
  words: number
  cx: number
  cy: number
  r: number
  lastOrder: number
}

export interface LengthMixLayout extends ViewLayout {
  baseline: number
  dots: MixDot[]
  bins: { x: number; label: string; count: number }[]
  labelY: number
}

const PAD_X = 8
const TOP = 16
const LABEL_BAND = 40
const MAX_ROWS = 12
const MIN_ROWS = 3

export function layoutLengthMix(score: Score, width: number): LengthMixLayout {
  const binWidth = (width - PAD_X * 2) / LENGTH_BINS.length
  const r = Math.min(9, Math.max(5, binWidth / 8))
  const step = r * 2 + 4
  const binOf = score.phrases.map((p) => lengthBin(p.words))
  const counts = LENGTH_BINS.map((_, b) => binOf.filter((x) => x === b).length)
  const maxCount = Math.max(0, ...counts)

  const fit = Math.max(1, Math.floor((binWidth * 0.8) / step))
  const columns = Math.max(1, Math.min(fit, Math.ceil(maxCount / MAX_ROWS)))
  const rows = Math.max(MIN_ROWS, Math.ceil(maxCount / columns))
  const baseline = TOP + rows * step
  const binCenter = (b: number) => PAD_X + b * binWidth + binWidth / 2

  const notes = orderedNotes(score)
  const filled = LENGTH_BINS.map(() => 0)
  const targets: Targets = {}
  const dots: MixDot[] = score.phrases.map((phrase, i) => {
    const bin = binOf[i]
    const k = filled[bin]++
    const col = k % columns
    const row = Math.floor(k / columns)
    const own = notes.filter((n) => n.phrase === phrase.index)
    const dot: MixDot = {
      phrase: phrase.index,
      bin,
      words: phrase.words,
      cx: binCenter(bin) + (col - (columns - 1) / 2) * step,
      cy: baseline - step / 2 - row * step,
      r,
      lastOrder: own.at(-1)?.order ?? 0,
    }
    for (const n of own) targets[n.key] = [dot.cx, dot.cy]
    return dot
  })

  return {
    width,
    height: baseline + LABEL_BAND,
    targets,
    baseline,
    dots,
    bins: LENGTH_BINS.map((bin, b) => ({ x: binCenter(b), label: bin.label, count: counts[b] })),
    labelY: baseline + 22,
  }
}
