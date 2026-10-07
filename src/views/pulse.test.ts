import { describe, expect, it } from 'vitest'
import { score, sentence } from '../test/builders'
import { layoutPulse } from './pulse'

describe('layoutPulse', () => {
  const layout = layoutPulse(
    score(sentence(0, 5), sentence(1, 5), sentence(2, 5), sentence(3, 10)),
    216,
  )

  it('draws one column per sentence, scaled to the longest', () => {
    expect(layout.baseline).toBe(168)
    expect(layout.height).toBe(204)
    expect(layout.columns.map((c) => [c.x, c.width, c.top, c.height, c.emphasis])).toEqual([
      [21, 24, 98, 70, true],
      [71, 24, 98, 70, true],
      [121, 24, 98, 70, true],
      [171, 24, 28, 140, false],
    ])
  })

  it('labels the extremes, the mean, and the drone', () => {
    expect(layout.labels).toEqual([
      { x: 183, y: 20, text: '10' },
      { x: 33, y: 90, text: '5' },
    ])
    expect(layout.mean).toEqual({ y: 80.5, label: 'average 6' })
    expect(layout.run).toEqual({ x1: 21, x2: 145, y: 186, label: '3 in a row' })
  })

  it('stacks each sentence’s words inside its column', () => {
    expect(layout.targets['0:0']).toEqual([33, 161])
    expect(layout.targets['3:9']).toEqual([183, 35])
    expect(layout.columns[3]).toMatchObject({ firstOrder: 15, lastOrder: 24 })
  })

  it('skips the run when no three sentences match', () => {
    expect(layoutPulse(score(sentence(0, 2), sentence(1, 9)), 216).run).toBeNull()
  })

  it('returns an empty frame for an empty score', () => {
    expect(layoutPulse(score(), 216)).toMatchObject({ columns: [], mean: null, height: 204 })
  })
})
