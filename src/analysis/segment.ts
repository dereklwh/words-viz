import type { Span } from './types'

export interface WordToken extends Span {
  text: string
  /** Non-word text between the previous word (or sentence start) and this word. */
  gapBefore: string
}

export interface SentenceSpan extends Span {
  words: WordToken[]
  /** Non-word text after the last word, e.g. `."` */
  trailing: string
  endsParagraph: boolean
}

const sentenceSegmenter = new Intl.Segmenter('en', { granularity: 'sentence' })
const wordSegmenter = new Intl.Segmenter('en', { granularity: 'word' })

const ABBREVIATIONS = new Set([
  'mr',
  'mrs',
  'ms',
  'dr',
  'prof',
  'sr',
  'jr',
  'st',
  'mt',
  'vs',
  'fig',
  'approx',
  'e.g',
  'i.e',
  'cf',
])

export function segmentParagraphs(text: string): Span[] {
  const spans: Span[] = []
  const separator = /\n[ \t]*\n\s*/g
  let start = 0
  for (const match of text.matchAll(separator)) {
    spans.push({ start, end: match.index })
    start = match.index + match[0].length
  }
  spans.push({ start, end: text.length })
  return spans.filter((p) => text.slice(p.start, p.end).trim().length > 0)
}

export function segmentWords(text: string, span: Span): WordToken[] {
  const words: WordToken[] = []
  let cursor = span.start
  for (const seg of wordSegmenter.segment(text.slice(span.start, span.end))) {
    if (!seg.isWordLike) continue
    const start = span.start + seg.index
    words.push({
      start,
      end: start + seg.segment.length,
      text: seg.segment,
      gapBefore: text.slice(cursor, start),
    })
    cursor = start + seg.segment.length
  }
  return words
}

function endsWithAbbreviation(words: WordToken[], trailing: string): boolean {
  const last = words.at(-1)
  if (!last || !trailing.trimStart().startsWith('.')) return false
  const word = last.text.toLowerCase()
  return ABBREVIATIONS.has(word) || /^\p{Lu}$/u.test(last.text)
}

export function segmentSentences(text: string): SentenceSpan[] {
  const sentences: SentenceSpan[] = []
  for (const paragraph of segmentParagraphs(text)) {
    // Hard-wrapped lines would otherwise force sentence breaks; same length keeps offsets valid.
    const unwrapped = text.slice(paragraph.start, paragraph.end).replace(/\n/g, ' ')
    const inParagraph: SentenceSpan[] = []
    let carryStart: number | undefined

    for (const seg of sentenceSegmenter.segment(unwrapped)) {
      const start = carryStart ?? paragraph.start + seg.index
      const end = paragraph.start + seg.index + seg.segment.length
      const words = segmentWords(text, { start, end })
      if (words.length === 0) continue
      const trailing = text.slice(words.at(-1)!.end, end)
      if (endsWithAbbreviation(words, trailing) && end < paragraph.end) {
        carryStart = start
        continue
      }
      carryStart = undefined
      inParagraph.push({
        start,
        end: trimEnd(text, start, end),
        words,
        trailing: trailing.trimEnd(),
        endsParagraph: false,
      })
    }

    if (carryStart !== undefined) {
      const words = segmentWords(text, { start: carryStart, end: paragraph.end })
      const trailing = text.slice(words.at(-1)!.end, paragraph.end)
      inParagraph.push({
        start: carryStart,
        end: trimEnd(text, carryStart, paragraph.end),
        words,
        trailing: trailing.trimEnd(),
        endsParagraph: false,
      })
    }
    const last = inParagraph.at(-1)
    if (last) last.endsParagraph = true
    sentences.push(...inParagraph)
  }
  return sentences
}

function trimEnd(text: string, start: number, end: number): number {
  while (end > start && /\s/.test(text[end - 1])) end--
  return end
}
