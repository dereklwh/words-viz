import type { Metrics, Phrase } from './types'

export function longestRun(lengths: number[]): Metrics['longestRun'] {
  let best = { start: 0, length: 0 }
  for (let start = 0; start < lengths.length; start++) {
    let end = start + 1
    while (end < lengths.length && Math.abs(lengths[end] - lengths[start]) <= 1) end++
    if (end - start > best.length) best = { start, length: end - start }
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
