import paragraphs from './paragraphs.json'

export interface Sample {
  id: string
  author: string
  work: string
  year: number
  text: string
}

export const SAMPLES: readonly Sample[] = paragraphs

/** A random sample other than `currentId`, so every click visibly changes the paragraph. */
export function pickSample(currentId?: string, random: () => number = Math.random): Sample {
  const pool = SAMPLES.filter((s) => s.id !== currentId)
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]
}

/** The sample this text came from, while it's still untouched. */
export function sampleFor(text: string): Sample | undefined {
  return SAMPLES.find((s) => s.text === text)
}
