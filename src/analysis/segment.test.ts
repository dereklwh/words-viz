import { describe, expect, it } from 'vitest'
import { segmentParagraphs, segmentSentences, segmentWords } from './segment'

const sentenceTexts = (text: string) =>
  segmentSentences(text).map((s) => text.slice(s.start, s.end))

describe('segmentSentences', () => {
  it('splits on terminal punctuation', () => {
    expect(sentenceTexts('Now listen. Music. The writing sings.')).toEqual([
      'Now listen.',
      'Music.',
      'The writing sings.',
    ])
  })

  it('does not split after titles or initials', () => {
    expect(sentenceTexts('Dr. Smith arrived. Mrs. Jones left.')).toEqual([
      'Dr. Smith arrived.',
      'Mrs. Jones left.',
    ])
    expect(sentenceTexts('J. R. R. Tolkien wrote books.')).toEqual([
      'J. R. R. Tolkien wrote books.',
    ])
  })

  it('keeps sentence breaks after a lone capital that is not an initial', () => {
    expect(sentenceTexts('Take vitamin A. Then rest.')).toEqual(['Take vitamin A.', 'Then rest.'])
    expect(sentenceTexts('Plan B. Then go.')).toEqual(['Plan B.', 'Then go.'])
    expect(sentenceTexts('I met John F. Kennedy. He waved.')).toEqual([
      'I met John F. Kennedy.',
      'He waved.',
    ])
  })

  it('keeps sentence breaks after post-nominals', () => {
    expect(sentenceTexts('I spoke to John Jr. Then left.')).toEqual([
      'I spoke to John Jr.',
      'Then left.',
    ])
  })

  it('keeps dialogue attribution with its quote', () => {
    expect(sentenceTexts('“Stop!” she said. Then left.')).toEqual([
      '“Stop!” she said.',
      'Then left.',
    ])
    expect(sentenceTexts('"Is it over?" she asked.')).toEqual(['"Is it over?" she asked.'])
  })

  it('handles Windows line endings', () => {
    const text = 'One.\r\n\r\nTwo is\r\nwrapped here.'
    expect(sentenceTexts(text)).toEqual(['One.', 'Two is\r\nwrapped here.'])
    expect(segmentSentences(text).map((s) => s.endsParagraph)).toEqual([true, true])
  })

  it('skips paragraphs without words', () => {
    expect(sentenceTexts('...\n\nReal words.')).toEqual(['Real words.'])
  })

  it('ignores hard wraps inside a paragraph', () => {
    expect(sentenceTexts('This line was\nwrapped by a PDF. Next.')).toEqual([
      'This line was\nwrapped by a PDF.',
      'Next.',
    ])
  })

  it('marks paragraph endings', () => {
    const text = 'One. Two.\n\n  Three.'
    expect(segmentSentences(text).map((s) => s.endsParagraph)).toEqual([false, true, true])
    expect(sentenceTexts(text)).toEqual(['One.', 'Two.', 'Three.'])
  })

  it('captures trailing punctuation including quotes', () => {
    const [s] = segmentSentences('"Is it over?"')
    expect(s.trailing).toBe('?"')
  })
})

describe('segmentParagraphs', () => {
  it('splits on CRLF and lone CR blank lines', () => {
    expect(segmentParagraphs('A.\r\n\r\nB.\r\rC.')).toEqual([
      { start: 0, end: 2 },
      { start: 6, end: 8 },
      { start: 10, end: 12 },
    ])
  })

  it('drops blank paragraphs', () => {
    expect(segmentParagraphs('\n\nA.\n\n\n\nB.\n\n')).toEqual([
      { start: 2, end: 4 },
      { start: 8, end: 10 },
    ])
  })
})

describe('segmentWords', () => {
  it('keeps contractions whole and records gaps', () => {
    const text = 'It wasn’t, don’t—stop.'
    const words = segmentWords(text, { start: 0, end: text.length })
    expect(words.map((w) => [w.text, w.gapBefore])).toEqual([
      ['It', ''],
      ['wasn’t', ' '],
      ['don’t', ', '],
      ['stop', '—'],
    ])
  })
})
