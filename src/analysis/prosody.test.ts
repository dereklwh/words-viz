import { beforeAll, describe, expect, it } from 'vitest'
import { loadLexicon } from './lexicon'
import { pronounce } from './prosody'
import type { Lexicon } from './types'

let lexicon: Lexicon
beforeAll(async () => {
  lexicon = await loadLexicon()
})

describe('pronounce', () => {
  it('reads stress from the dictionary', () => {
    expect(pronounce('sentence', lexicon)).toEqual({
      syllables: 2,
      stress: [1, 0],
      isFunctionWord: false,
      guessed: false,
    })
    expect(pronounce('Important', lexicon).stress).toEqual([2, 1, 0])
  })

  it('reduces function words', () => {
    expect(pronounce('of', lexicon)).toMatchObject({ stress: [0], isFunctionWord: true })
  })

  it('normalizes curly apostrophes and possessives', () => {
    expect(pronounce('wasn’t', lexicon)).toMatchObject({ syllables: 2, guessed: false })
    expect(pronounce("reader's", lexicon)).toMatchObject({ syllables: 2, guessed: false })
  })

  it('guesses unknown words and numbers', () => {
    expect(pronounce('blorptastic', lexicon)).toMatchObject({ syllables: 3, guessed: true })
    expect(pronounce('1,999', lexicon)).toMatchObject({ syllables: 4, guessed: true })
  })
})

describe('lexicon', () => {
  it('ignores prototype keys', () => {
    expect(lexicon('__proto__')).toBeUndefined()
    expect(lexicon('hasOwnProperty')).toBeUndefined()
  })
})
