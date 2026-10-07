/** Seconds a word takes to fly from the paragraph into its note. */
export const FLIGHT = 0.8

const MAX_STAGGER = 0.045
const MAX_SPREAD = 1.8

/** Words leave in reading order; long paragraphs compress the stagger to keep the moment short. */
export function departure(order: number, total: number): number {
  return order * Math.min(MAX_STAGGER, MAX_SPREAD / Math.max(1, total))
}

export function arrival(order: number, total: number): number {
  return departure(order, total) + FLIGHT * 0.8
}
