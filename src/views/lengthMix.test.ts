import { describe, expect, it } from 'vitest'
import { score, sentence } from '../test/builders'
import { layoutLengthMix } from './lengthMix'

const lengths = (...words: number[]) => score(...words.map((w, i) => sentence(i, w)))

describe('layoutLengthMix', () => {
  const layout = layoutLengthMix(lengths(5, 5, 2, 12), 600)

  it('lays out one row per length band', () => {
    expect(layout.rows.map((r) => [r.name, r.range, r.top, r.centerY, r.count, r.countX])).toEqual([
      ['Very short', '1–4 words', 8, 26, 1, 149],
      ['Short', '5–9 words', 44, 62, 2, 172],
      ['Medium', '10–17 words', 80, 98, 1, 149],
      ['Long', '18–29 words', 116, 134, 0, 126],
      ['Very long', '30+ words', 152, 170, 0, 126],
    ])
    expect(layout.height).toBe(196)
  })

  it('tallies a dot per sentence in reading order', () => {
    expect(layout.dots.map((d) => [d.phrase, d.bin, d.cx, d.cy, d.r])).toEqual([
      [0, 1, 129, 62, 9],
      [1, 1, 152, 62, 9],
      [2, 0, 129, 26, 9],
      [3, 2, 129, 98, 9],
    ])
    expect(layout.targets['1:4']).toEqual([152, 62])
  })

  it('wraps a crowded band onto extra lines', () => {
    const crowded = layoutLengthMix(lengths(5, 5, 5, 5, 5, 5), 200)
    expect(crowded.rows[1]).toMatchObject({ top: 44, centerY: 62, count: 6 })
    expect(crowded.rows[2].top).toBe(99)
    expect(crowded.dots[4]).toMatchObject({ cx: 91, cy: 81, r: 7 })
    expect(crowded.height).toBe(215)
  })
})
