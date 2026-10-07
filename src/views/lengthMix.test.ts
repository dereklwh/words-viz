import { describe, expect, it } from 'vitest'
import { score, sentence } from '../test/builders'
import { layoutLengthMix } from './lengthMix'

describe('layoutLengthMix', () => {
  const layout = layoutLengthMix(
    score(sentence(0, 5), sentence(1, 5), sentence(2, 2), sentence(3, 12)),
    516,
  )

  it('stacks one dot per sentence in its length bin', () => {
    expect(layout.baseline).toBe(82)
    expect(layout.dots.map((d) => [d.phrase, d.bin, d.cx, d.cy, d.r])).toEqual([
      [0, 1, 158, 71, 9],
      [1, 1, 158, 49, 9],
      [2, 0, 58, 71, 9],
      [3, 2, 258, 71, 9],
    ])
    expect(layout.height).toBe(122)
  })

  it('labels every bin with its count', () => {
    expect(layout.bins.map((b) => [b.x, b.label, b.count])).toEqual([
      [58, '1–4', 1],
      [158, '5–9', 2],
      [258, '10–17', 1],
      [358, '18–29', 0],
      [458, '30+', 0],
    ])
    expect(layout.labelY).toBe(104)
  })

  it('sends every word to its sentence’s dot', () => {
    expect(layout.targets['1:4']).toEqual([158, 49])
    expect(layout.targets['3:11']).toEqual([258, 71])
  })
})
