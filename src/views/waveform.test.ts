import { describe, expect, it } from 'vitest'
import { note, phrase, rest, score, sentence } from '../test/builders'
import { layoutWaveform } from './waveform'

describe('layoutWaveform', () => {
  it('draws a bar per syllable, tall where stressed, with silence for rests', () => {
    const layout = layoutWaveform(
      score(phrase(0, [note('a'), note('bb', { syllables: 2, functionWord: true }), rest(2)])),
      600,
    )
    expect(layout.bars.map((b) => [b.text, b.x, b.width, b.y, b.amplitude, b.faint])).toEqual([
      ['a', 0, 5, 52, 40, false],
      ['bb', 14, 5, 52, 8.8, true],
      ['bb', 21, 5, 52, 8.8, true],
    ])
    expect(layout.rows).toEqual([{ y: 52, end: 50 }])
    expect(layout.targets).toEqual({ '0:0': [2.5, 52], '0:1': [20, 52] })
    expect(layout.height).toBe(104)
  })

  it('wraps whole words onto new rows', () => {
    const layout = layoutWaveform(score(sentence(0, 4)), 30)
    expect(layout.rows).toEqual([
      { y: 52, end: 28 },
      { y: 160, end: 20 },
    ])
    expect(layout.bars.map((b) => [b.x, b.y])).toEqual([
      [0, 52],
      [12, 52],
      [24, 52],
      [0, 160],
    ])
    expect(layout.height).toBe(212)
  })
})
