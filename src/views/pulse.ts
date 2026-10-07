import type { Score } from '../analysis'
import { excerpt, orderedNotes, type Targets, type ViewLayout } from './types'

export interface PulseColumn {
  phrase: number
  text: string
  x: number
  width: number
  top: number
  height: number
  words: number
  emphasis: boolean
  /** Taller than the axis allows; drawn to the top with a break mark. */
  broken: boolean
  firstOrder: number
  lastOrder: number
}

export interface PulseLayout extends ViewLayout {
  baseline: number
  plotWidth: number
  /** Height of one word-brick, or 0 when bricks would be too thin to read. */
  wordHeight: number
  columns: PulseColumn[]
  ticks: { x: number; label: string }[]
  mean: { y: number; x: number; anchor: 'start' | 'end'; label: string } | null
  labels: { x: number; y: number; text: string }[]
  run: { x1: number; x2: number; y: number; label: string } | null
}

const TOP = 28
const BOTTOM = 52
const SLOT = 44
const MIN_PLOT = 320
const MAX_COLUMN = 24
const COLUMN_GAP = 6
const MIN_RUN = 3
const MIN_BRICK = 10
const MIN_TICK_SLOT = 16
/** An outlier this many times the runner-up gets an axis break. */
const BREAK_RATIO = 2.5
const BREAK_HEADROOM = 1.25
/** Room reserved for the mean label, approximating "average 54 words" at 12px. */
const MEAN_LABEL_WIDTH = 104

/** Puts the mean label on whichever end of the line no column reaches into. */
function placeMeanLabel(columns: PulseColumn[], y: number, right: number) {
  const clear = (x0: number, x1: number) =>
    !columns.some((c) => c.x < x1 && c.x + c.width > x0 && c.top < y)
  if (clear(right - MEAN_LABEL_WIDTH, right)) return { x: right, anchor: 'end' as const }
  if (clear(0, MEAN_LABEL_WIDTH)) return { x: 0, anchor: 'start' as const }
  return { x: right, anchor: 'end' as const }
}

export function layoutPulse(score: Score, width: number): PulseLayout {
  const { lengths, longestRun, meanLength } = score.metrics
  const plotHeight = Math.min(220, Math.max(140, width * 0.2))
  const baseline = TOP + plotHeight
  const height = baseline + BOTTOM
  const count = score.phrases.length
  const empty = { ticks: [], mean: null, labels: [], run: null, columns: [], wordHeight: 0 }
  if (count === 0) return { width, height, targets: {}, baseline, plotWidth: width, ...empty }

  const plotWidth = Math.min(width, Math.max(MIN_PLOT, count * SLOT))
  const slot = plotWidth / count
  const columnWidth = Math.max(2, Math.min(MAX_COLUMN, slot - COLUMN_GAP))

  const sorted = [...lengths].sort((a, b) => b - a)
  const [max, runnerUp = max] = sorted
  const hasBreak = count >= 3 && max > runnerUp * BREAK_RATIO
  const domain = hasBreak ? runnerUp * BREAK_HEADROOM : max
  const perWord = plotHeight / domain
  const inRun = (i: number) =>
    longestRun.length >= MIN_RUN &&
    i >= longestRun.start &&
    i < longestRun.start + longestRun.length

  const notes = orderedNotes(score)
  const columns: PulseColumn[] = score.phrases.map((phrase, i) => {
    const own = notes.filter((n) => n.phrase === phrase.index)
    const broken = phrase.words > domain
    const h = broken ? plotHeight : phrase.words * perWord
    return {
      phrase: phrase.index,
      text: excerpt(phrase.text),
      x: i * slot + (slot - columnWidth) / 2,
      width: columnWidth,
      top: baseline - h,
      height: h,
      words: phrase.words,
      emphasis: inRun(i),
      broken,
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

  const meanY = baseline - Math.min(plotHeight, meanLength * perWord)
  const runStart = columns[longestRun.start]
  const runEnd = columns[longestRun.start + longestRun.length - 1]
  const runLengths = lengths.slice(longestRun.start, longestRun.start + longestRun.length)
  const typical = Math.round(runLengths.reduce((a, b) => a + b, 0) / Math.max(1, runLengths.length))

  return {
    width,
    height,
    targets,
    baseline,
    plotWidth,
    wordHeight: perWord >= MIN_BRICK ? perWord : 0,
    columns,
    ticks:
      slot >= MIN_TICK_SLOT
        ? columns.map((c) => ({ x: center(c), label: String(c.phrase + 1) }))
        : [],
    mean: {
      y: meanY,
      ...placeMeanLabel(columns, meanY, plotWidth),
      label: `average ${Math.round(meanLength)} words`,
    },
    labels,
    run:
      longestRun.length >= MIN_RUN
        ? {
            x1: runStart.x,
            x2: runEnd.x + runEnd.width,
            y: baseline + 28,
            label: `${longestRun.length} sentences of about ${typical} words`,
          }
        : null,
  }
}
