import { describe, expect, it } from 'vitest'
import { score, sentence } from '../test/builders'
import { layoutPulse } from './pulse'

const lengths = (...words: number[]) => score(...words.map((w, i) => sentence(i, w)))

describe('layoutPulse', () => {
  const layout = layoutPulse(lengths(5, 5, 5, 10), 600)

  it('packs columns into a strip and builds them from word bricks', () => {
    expect(layout.plotWidth).toBe(320)
    expect(layout.baseline).toBe(168)
    expect(layout.height).toBe(220)
    expect(layout.wordHeight).toBe(14)
    expect(
      layout.columns.map((c) => [c.x, c.width, c.top, c.height, c.emphasis, c.broken]),
    ).toEqual([
      [28, 24, 98, 70, true, false],
      [108, 24, 98, 70, true, false],
      [188, 24, 98, 70, true, false],
      [268, 24, 28, 140, false, false],
    ])
  })

  it('labels the extremes, the mean, the drone, and every sentence', () => {
    expect(layout.labels).toEqual([
      { x: 280, y: 20, text: '10' },
      { x: 40, y: 90, text: '5' },
    ])
    expect(layout.mean).toEqual({ y: 80.5, x: 0, anchor: 'start', label: 'average 6 words' })
    expect(layout.run).toEqual({ x1: 28, x2: 212, y: 196, label: '3 sentences of about 5 words' })
    expect(layout.ticks.map((t) => [t.x, t.label])).toEqual([
      [40, '1'],
      [120, '2'],
      [200, '3'],
      [280, '4'],
    ])
  })

  it('stacks each sentence’s words inside its column', () => {
    expect(layout.targets['0:0']).toEqual([40, 161])
    expect(layout.targets['3:9']).toEqual([280, 35])
  })

  it('breaks the axis for an outlier so the rest keep their height', () => {
    const broken = layoutPulse(lengths(4, 4, 4, 40), 600)
    expect(broken.wordHeight).toBe(28)
    expect(broken.columns.map((c) => [c.height, c.broken])).toEqual([
      [112, false],
      [112, false],
      [112, false],
      [140, true],
    ])
    expect(broken.labels[0]).toEqual({ x: 280, y: 20, text: '40' })
  })

  it('keeps the mean label on the right when nothing reaches it', () => {
    expect(layoutPulse(lengths(10, 2, 2), 600).mean).toMatchObject({ x: 320, anchor: 'end' })
  })

  it('skips the run when no three sentences match', () => {
    expect(layoutPulse(lengths(2, 9), 600).run).toBeNull()
  })

  it('returns an empty frame for an empty score', () => {
    expect(layoutPulse(score(), 600)).toMatchObject({ columns: [], mean: null, height: 220 })
  })
})
