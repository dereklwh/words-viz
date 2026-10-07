import type { Score } from '../analysis'
import { orderedNotes, type Targets, type ViewLayout } from './types'

export interface PulseColumn {
  phrase: number
  x: number
  width: number
  top: number
  height: number
  words: number
  emphasis: boolean
  firstOrder: number
  lastOrder: number
}

export interface PulseLayout extends ViewLayout {
  baseline: number
  columns: PulseColumn[]
  mean: { y: number; x: number; anchor: 'start' | 'end'; label: string } | null
  labels: { x: number; y: number; text: string }[]
  run: { x1: number; x2: number; y: number; label: string } | null
}

const PAD_X = 8
const TOP = 28
const BOTTOM = 36
const MAX_COLUMN = 24
const GAP = 2
const MIN_RUN = 3
/** Room reserved for the mean label, approximating "average 54" at 12px. */
const MEAN_LABEL_WIDTH = 72

/** Puts the mean label on whichever end of the line no column reaches into. */
function placeMeanLabel(columns: PulseColumn[], y: number, width: number) {
  const clear = (x0: number, x1: number) =>
    !columns.some((c) => c.x < x1 && c.x + c.width > x0 && c.top < y)
  if (clear(width - MEAN_LABEL_WIDTH, width)) return { x: width, anchor: 'end' as const }
  if (clear(0, MEAN_LABEL_WIDTH)) return { x: 0, anchor: 'start' as const }
  return { x: width, anchor: 'end' as const }
}

export function layoutPulse(score: Score, width: number): PulseLayout {
  const { lengths, longestRun, meanLength } = score.metrics
  const plotHeight = Math.min(240, Math.max(140, width * 0.24))
  const baseline = TOP + plotHeight
  const height = baseline + BOTTOM
  const count = score.phrases.length
  if (count === 0) {
    return { width, height, targets: {}, baseline, columns: [], mean: null, labels: [], run: null }
  }

  const max = Math.max(...lengths)
  const slot = (width - PAD_X * 2) / count
  const columnWidth = Math.max(2, Math.min(MAX_COLUMN, slot - GAP))
  const scale = (words: number) => (words / max) * plotHeight
  const inRun = (i: number) =>
    longestRun.length >= MIN_RUN &&
    i >= longestRun.start &&
    i < longestRun.start + longestRun.length

  const notes = orderedNotes(score)
  const columns: PulseColumn[] = score.phrases.map((phrase, i) => {
    const own = notes.filter((n) => n.phrase === phrase.index)
    const h = scale(phrase.words)
    return {
      phrase: phrase.index,
      x: PAD_X + i * slot + (slot - columnWidth) / 2,
      width: columnWidth,
      top: baseline - h,
      height: h,
      words: phrase.words,
      emphasis: inRun(i),
      firstOrder: own[0]?.order ?? 0,
      lastOrder: own.at(-1)?.order ?? 0,
    }
  })

  // Words stack as bricks inside their sentence's column.
  const targets: Targets = {}
  for (const column of columns) {
    const own = notes.filter((n) => n.phrase === column.phrase)
    own.forEach((n, j) => {
      targets[n.key] = [
        column.x + column.width / 2,
        baseline - ((j + 0.5) / own.length) * column.height,
      ]
    })
  }

  const center = (c: PulseColumn) => c.x + c.width / 2
  const longest = columns[lengths.indexOf(max)]
  const shortest = columns[lengths.indexOf(Math.min(...lengths))]
  const labels = [longest, ...(shortest.words !== longest.words ? [shortest] : [])].map((c) => ({
    x: center(c),
    y: c.top - 8,
    text: String(c.words),
  }))

  const meanY = baseline - scale(meanLength)
  const runStart = columns[longestRun.start]
  const runEnd = columns[longestRun.start + longestRun.length - 1]
  return {
    width,
    height,
    targets,
    baseline,
    columns,
    mean: {
      y: meanY,
      ...placeMeanLabel(columns, meanY, width),
      label: `average ${Math.round(meanLength)}`,
    },
    labels,
    run:
      longestRun.length >= MIN_RUN
        ? {
            x1: runStart.x,
            x2: runEnd.x + runEnd.width,
            y: baseline + 18,
            label: `${longestRun.length} in a row`,
          }
        : null,
  }
}
