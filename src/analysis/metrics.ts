import type { Metrics, Phrase } from './types'

export function longestRun(lengths: number[]): Metrics['longestRun'] {
  let best = { start: 0, length: lengths.length > 0 ? 1 : 0 }
  let start = 0
  for (let i = 1; i <= lengths.length; i++) {
    if (i < lengths.length && Math.abs(lengths[i] - lengths[start]) <= 1) continue
    if (i - start > best.length) best = { start, length: i - start }
    start = i
  }
  return best
}

export function computeMetrics(phrases: Phrase[]): Metrics {
  const lengths = phrases.map((p) => p.words)
  const sentences = phrases.length
  const words = lengths.reduce((a, b) => a + b, 0)
  const syllables = phrases.reduce((a, p) => a + p.syllables, 0)
  const beats = phrases.reduce((a, p) => a + p.beats, 0)
  const meanLength = sentences ? words / sentences : 0
  const variance = sentences
    ? lengths.reduce((a, n) => a + (n - meanLength) ** 2, 0) / sentences
    : 0
  const stdevLength = Math.sqrt(variance)

  return {
    sentences,
    words,
    syllables,
    beats,
    lengths,
    meanLength,
    stdevLength,
    variety: meanLength ? stdevLength / meanLength : 0,
    longestRun: longestRun(lengths),
    syllablesPerWord: words ? syllables / words : 0,
  }
}
