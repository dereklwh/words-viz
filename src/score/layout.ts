import type { Note, Rest, Score } from '../analysis'

export interface LayoutOptions {
  width: number
  beatWidth: number
  /** Distance between staff lines. */
  staffSpace: number
  /** Left margin of each system, room for the measure number. */
  indent: number
  systemGap: number
  /** Headroom above the first system for accents and contour. */
  marginTop: number
}

export interface PlacedNote {
  key: string
  note: Note
  system: number
  x: number
  width: number
  /** Center line of the note. */
  y: number
  /** Position in reading order, for staggered entrances. */
  order: number
}

export interface PlacedRest {
  key: string
  rest: Rest
  system: number
  x: number
  width: number
  y: number
}

export interface PlacedBar {
  system: number
  x: number
  kind: 'single' | 'double' | 'final'
}

export interface PlacedTie {
  system: number
  x1: number
  x2: number
  y: number
}

export interface StaffSystem {
  index: number
  /** Top staff line. */
  top: number
  /** Width actually used by events. */
  end: number
  /** Measure number of the first phrase starting on this system. */
  measure: number
}

export interface ScoreLayout {
  width: number
  height: number
  staffSpace: number
  systems: StaffSystem[]
  notes: PlacedNote[]
  rests: PlacedRest[]
  bars: PlacedBar[]
  ties: PlacedTie[]
  /** Pitch contour, one polyline per phrase per system. */
  contours: { system: number; points: [number, number][] }[]
}

export const noteKey = (phrase: number, event: number) => `${phrase}:${event}`

export function defaultOptions(width: number): LayoutOptions {
  const staffSpace = width < 560 ? 9 : 11
  return {
    width,
    beatWidth: Math.min(34, Math.max(18, width / 36)),
    staffSpace,
    indent: staffSpace * 3,
    systemGap: staffSpace * 7,
    marginTop: staffSpace * 3,
  }
}

export function layoutScore(score: Score, options: LayoutOptions): ScoreLayout {
  const { width, beatWidth, staffSpace, indent, systemGap, marginTop } = options
  const staffHeight = staffSpace * 4
  const systems: StaffSystem[] = []
  const notes: PlacedNote[] = []
  const rests: PlacedRest[] = []
  const bars: PlacedBar[] = []
  const ties: PlacedTie[] = []
  const contours: ScoreLayout['contours'] = []

  let cursor = indent
  let contour: [number, number][] = []
  let pendingMeasure = 1
  let order = 0

  const system = () => systems.at(-1)!
  const pitchY = (degree: number) => system().top + staffHeight - (degree * staffSpace) / 2
  const flushContour = () => {
    if (contour.length > 0 && systems.length > 0)
      contours.push({ system: system().index, points: contour })
    contour = []
  }
  const newSystem = () => {
    flushContour()
    const index = systems.length
    systems.push({
      index,
      top: marginTop + index * (staffHeight + systemGap),
      end: indent,
      measure: pendingMeasure,
    })
    cursor = indent
  }

  for (const phrase of score.phrases) {
    pendingMeasure = phrase.index + 1
    if (systems.length === 0) newSystem()
    let previous: PlacedNote | undefined

    phrase.events.forEach((event, i) => {
      const advance = event.beats * beatWidth
      if (cursor + advance > width && cursor > indent) {
        newSystem()
        previous = undefined
      }
      const key = noteKey(phrase.index, i)
      if (event.kind === 'note') {
        const placed: PlacedNote = {
          key,
          note: event,
          system: system().index,
          x: cursor,
          width: advance,
          y: pitchY(event.degree),
          order: order++,
        }
        if (event.tie && previous) {
          ties.push({
            system: placed.system,
            x1: previous.x + previous.width,
            x2: placed.x,
            y: Math.min(previous.y, placed.y) - staffSpace * 0.7,
          })
        }
        notes.push(placed)
        contour.push([placed.x + advance / 2, placed.y])
        previous = placed
      } else {
        rests.push({
          key,
          rest: event,
          system: system().index,
          x: cursor,
          width: advance,
          y: pitchY(4),
        })
        if (contour.length > 0 && event.rest === 'cadence') flushContour()
        previous = undefined
      }
      cursor += advance
      system().end = cursor
    })

    const isLast = phrase.index === score.phrases.length - 1
    bars.push({
      system: system().index,
      x: cursor,
      kind: isLast ? 'final' : phrase.endsParagraph ? 'double' : 'single',
    })
  }
  flushContour()

  const last = systems.at(-1)
  return {
    width,
    height: last ? last.top + staffHeight + marginTop : 0,
    staffSpace,
    systems,
    notes,
    rests,
    bars,
    ties,
    contours,
  }
}

/** A single empty staff, shown before anything has been analyzed. */
export function emptyStaffLayout(width: number): ScoreLayout {
  const options = defaultOptions(width)
  return {
    width,
    height: options.marginTop * 2 + options.staffSpace * 4,
    staffSpace: options.staffSpace,
    systems: [{ index: 0, top: options.marginTop, end: options.indent, measure: 1 }],
    notes: [],
    rests: [],
    bars: [],
    ties: [],
    contours: [],
  }
}
