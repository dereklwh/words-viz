import { describe, expect, it } from 'vitest'
import type { Metrics, Note, Phrase, Rest, Score } from '../analysis'
import { layoutScore, type LayoutOptions } from './layout'

const note = (text: string, beats: number, degree: number, tie = false): Note => ({
  kind: 'note',
  text,
  start: 0,
  end: 0,
  syllables: beats * 2,
  stress: [1],
  isFunctionWord: false,
  guessed: false,
  tie,
  accent: false,
  beats,
  degree,
})

const cadence: Rest = { kind: 'rest', rest: 'cadence', mark: '.', beats: 2, start: 0, end: 0 }

const phrase = (index: number, events: Phrase['events'], endsParagraph = false): Phrase => ({
  index,
  text: '',
  start: 0,
  end: 0,
  events,
  words: 0,
  syllables: 0,
  beats: 0,
  cadence: 'full',
  endsParagraph,
})

const score = (...phrases: Phrase[]): Score => ({ text: '', phrases, metrics: {} as Metrics })

const options = (width: number): LayoutOptions => ({
  width,
  beatWidth: 20,
  staffSpace: 10,
  indent: 30,
  systemGap: 70,
  marginTop: 30,
})

const twoPhrases = score(
  phrase(0, [note('Now', 0.5, 6), note('listen', 1, 0), cadence]),
  phrase(1, [note('Music', 1, 4), note('sings', 0.5, 0), cadence], true),
)

describe('layoutScore', () => {
  it('places notes by beats and pitch on one system', () => {
    const layout = layoutScore(twoPhrases, options(200))
    expect(layout.systems).toEqual([{ index: 0, top: 30, end: 170, measure: 1 }])
    expect(layout.notes.map((n) => [n.key, n.x, n.width, n.y, n.order])).toEqual([
      ['0:0', 30, 10, 40, 0],
      ['0:1', 40, 20, 70, 1],
      ['1:0', 100, 20, 50, 2],
      ['1:1', 120, 10, 70, 3],
    ])
    expect(layout.rests.map((r) => [r.key, r.x, r.width, r.y])).toEqual([
      ['0:2', 60, 40, 50],
      ['1:2', 130, 40, 50],
    ])
    expect(layout.bars).toEqual([
      { system: 0, x: 100, kind: 'single' },
      { system: 0, x: 170, kind: 'final' },
    ])
    expect(layout.height).toBe(100)
  })

  it('wraps onto a new system when the line is full', () => {
    const layout = layoutScore(twoPhrases, options(150))
    expect(layout.systems).toEqual([
      { index: 0, top: 30, end: 130, measure: 1 },
      { index: 1, top: 140, end: 70, measure: 2 },
    ])
    expect(layout.rests[1]).toMatchObject({ system: 1, x: 30, y: 160 })
    expect(layout.bars[1]).toEqual({ system: 1, x: 70, kind: 'final' })
    expect(layout.height).toBe(210)
  })

  it('draws one contour per phrase per system', () => {
    const layout = layoutScore(twoPhrases, options(200))
    expect(layout.contours).toEqual([
      {
        system: 0,
        points: [
          [35, 40],
          [50, 70],
        ],
      },
      {
        system: 0,
        points: [
          [110, 50],
          [125, 70],
        ],
      },
    ])
  })

  it('ties hyphenated notes and marks paragraph ends', () => {
    const layout = layoutScore(
      score(
        phrase(0, [note('Five', 0.5, 5), note('word', 0.5, 3, true), cadence], true),
        phrase(1, [note('Fine', 0.5, 0), cadence]),
      ),
      options(400),
    )
    expect(layout.ties).toEqual([{ system: 0, x1: 40, x2: 40, y: 38 }])
    expect(layout.bars.map((b) => b.kind)).toEqual(['double', 'final'])
  })

  it('handles an empty score', () => {
    const layout = layoutScore(score(), options(200))
    expect(layout.systems).toEqual([])
    expect(layout.height).toBe(0)
  })
})
