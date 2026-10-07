import { describe, expect, it } from 'vitest'
import { note, phrase, rest, score, sentence } from '../test/builders'
import { layoutWaveform } from './waveform'

describe('layoutWaveform', () => {
  it('draws a bar per word, height by syllables, with silence for rests', () => {
    const layout = layoutWaveform(
      score(phrase(0, [note('a'), note('bb', { syllables: 2, functionWord: true }), rest(2)])),
      100,
    )
    expect(layout.bars.map((b) => [b.text, b.x, b.width, b.y, b.amplitude, b.faint])).toEqual([
      ['a', 3, 6, 46, 17, false],
      ['bb', 15, 6, 46, 34, true],
    ])
    expect(layout.rows).toEqual([{ y: 46, end: 60 }])
    expect(layout.targets).toEqual({ '0:0': [6, 46], '0:1': [18, 46] })
    expect(layout.height).toBe(92)
  })

  it('wraps onto new rows when bars would get too thin', () => {
    const layout = layoutWaveform(score(sentence(0, 6)), 20)
    expect(layout.rows.map((r) => r.y)).toEqual([46, 138])
    expect(layout.bars.map((b) => [b.x, b.y])).toEqual([
      [1, 46],
      [5, 46],
      [9, 46],
      [13, 46],
      [17, 46],
      [1, 138],
    ])
    expect(layout.height).toBe(184)
  })
})
