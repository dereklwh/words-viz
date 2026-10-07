import { describe, expect, it } from 'vitest'
import { analyze } from '../analysis'
import { pickSample, sampleFor, SAMPLES } from '.'

describe('SAMPLES', () => {
  it('holds ten paragraphs by ten authors', () => {
    expect(SAMPLES.map((s) => s.id)).toEqual([
      'hemingway',
      'dickens',
      'austen',
      'melville',
      'poe',
      'bronte',
      'lincoln',
      'woolf',
      'joyce',
      'fitzgerald',
    ])
    expect(new Set(SAMPLES.map((s) => s.author)).size).toBe(10)
  })

  it('analyzes every sample, down to Dickens’s single sentence', () => {
    for (const sample of SAMPLES) {
      expect(analyze(sample.text).phrases.length, sample.id).toBeGreaterThan(0)
    }
    expect(analyze(SAMPLES[1].text).phrases).toHaveLength(1)
    expect(analyze(SAMPLES[0].text).phrases).toHaveLength(4)
  })
})

describe('pickSample', () => {
  it('maps the random draw onto the pool', () => {
    expect(pickSample(undefined, () => 0).id).toBe('hemingway')
    expect(pickSample(undefined, () => 0.999).id).toBe('fitzgerald')
  })

  it('never repeats the current sample', () => {
    expect(pickSample('hemingway', () => 0).id).toBe('dickens')
    expect(pickSample('fitzgerald', () => 0.999).id).toBe('joyce')
  })
})

describe('sampleFor', () => {
  it('finds an untouched sample and forgets an edited one', () => {
    expect(sampleFor(SAMPLES[2].text)?.author).toBe('Jane Austen')
    expect(sampleFor(`${SAMPLES[2].text} And more.`)).toBeUndefined()
  })
})
