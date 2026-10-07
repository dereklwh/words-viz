import { isFunctionWord } from './prosody'
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

/** Titles always precede a name, so a period after one never ends a sentence. */
const TITLES = new Set(['mr', 'mrs', 'ms', 'dr', 'prof', 'st', 'mt', 'fig', 'approx', 'vs', 'cf'])

/** Capitalized words that usually open a sentence rather than continue a name. */
const SENTENCE_OPENERS = new Set(
  'then now but and so yet still later also however after before finally meanwhile instead'.split(
    ' ',
  ),
)

// A lone \r must not match the first half of \r\n, or one CRLF reads as a blank line.
const LINE_BREAK = /\r\n|\r(?!\n)|\n/
const PARAGRAPH_BREAK = new RegExp(
  `(?:${LINE_BREAK.source})[ \\t]*(?:${LINE_BREAK.source})\\s*`,
  'g',
)

export function segmentParagraphs(text: string): Span[] {
  const spans: Span[] = []
  let start = 0
  for (const match of text.matchAll(PARAGRAPH_BREAK)) {
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

const startsLowercase = (word: WordToken) => /^\p{Ll}/u.test(word.text)
const isCapitalized = (word: WordToken) => /^\p{Lu}/u.test(word.text)
const isInitial = (text: string, word: WordToken) =>
  /^\p{Lu}$/u.test(word.text) && text[word.end] === '.'

/** Decides whether an ICU sentence break between two segments is false. */
function continuesSentence(text: string, current: Span, words: WordToken[], next: WordToken[]) {
  const last = words.at(-1)!
  const first = next[0]
  // Dialogue tags (“Stop!” she said) and other lowercase continuations.
  if (startsLowercase(first)) return true
  if (text.slice(last.end, current.end).trim() !== '.') return false
  if (TITLES.has(last.text.toLowerCase())) return true
  if (!isInitial(text, last)) return false

  // An initial needs a name around it: "John F. Kennedy", not "vitamin A. Then".
  const before = words.at(-2)
  const nameBefore = !before || isCapitalized(before)
  const opener = isFunctionWord(first.text) || SENTENCE_OPENERS.has(first.text.toLowerCase())
  const nameAfter = isInitial(text, first) || (isCapitalized(first) && !opener)
  return nameBefore && nameAfter
}

/** Re-segments words over the full span so gaps across merged segments are kept. */
function toSentence(text: string, span: Span): SentenceSpan {
  const words = segmentWords(text, span)
  return {
    start: span.start,
    end: trimEnd(text, span.start, span.end),
    words,
    trailing: text.slice(words.at(-1)!.end, span.end).trimEnd(),
    endsParagraph: false,
  }
}

export function segmentSentences(text: string): SentenceSpan[] {
  const sentences: SentenceSpan[] = []
  for (const paragraph of segmentParagraphs(text)) {
    // Hard wraps would force sentence breaks; a 1:1 replacement keeps offsets valid.
    const unwrapped = text.slice(paragraph.start, paragraph.end).replace(/[\r\n]/g, ' ')
    const segments = [...sentenceSegmenter.segment(unwrapped)]
      .map((seg) => {
        const start = paragraph.start + seg.index
        const span = { start, end: start + seg.segment.length }
        return { span, words: segmentWords(text, span) }
      })
      .filter((seg) => seg.words.length > 0)

    if (segments.length === 0) continue
    const inParagraph: SentenceSpan[] = []
    let pending = segments[0]
    for (const next of segments.slice(1)) {
      if (continuesSentence(text, pending.span, pending.words, next.words)) {
        pending = {
          span: { start: pending.span.start, end: next.span.end },
          words: [...pending.words, ...next.words],
        }
      } else {
        inParagraph.push(toSentence(text, pending.span))
        pending = next
      }
    }
    inParagraph.push(toSentence(text, pending.span))

    inParagraph.at(-1)!.endsParagraph = true
    sentences.push(...inParagraph)
  }
  return sentences
}

function trimEnd(text: string, start: number, end: number): number {
  while (end > start && /\s/.test(text[end - 1])) end--
  return end
}
