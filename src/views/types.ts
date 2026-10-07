import type { Note, Score } from '../analysis'
import { noteKey } from '../score/layout'

/** Where each word's flight lands, in the view's SVG coordinates, keyed by `noteKey`. */
export type Targets = Record<string, [number, number]>

export interface ViewLayout {
  width: number
  height: number
  targets: Targets
}

/** What the pointer is on: drives the tooltip and the paragraph highlight. */
export interface Focus {
  phrase: number
  key?: string
  x: number
  y: number
  value: string
  label: string
}

export interface OrderedNote {
  key: string
  phrase: number
  note: Note
  order: number
}

export function orderedNotes(score: Score): OrderedNote[] {
  const notes: OrderedNote[] = []
  for (const phrase of score.phrases) {
    phrase.events.forEach((event, i) => {
      if (event.kind === 'note') {
        notes.push({
          key: noteKey(phrase.index, i),
          phrase: phrase.index,
          note: event,
          order: notes.length,
        })
      }
    })
  }
  return notes
}
