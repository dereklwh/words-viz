import type { Focus } from './types'

export interface ViewProps<L> {
  layout: L
  /** Animate marks in as words land; false renders the settled chart. */
  entrance: boolean
  /** Word count, for staggering arrivals. */
  total: number
  focus: Focus | null
  onFocus: (focus: Focus | null) => void
}

/** A bar whose data end is rounded and whose baseline end is square. */
export function columnPath(
  x: number,
  top: number,
  width: number,
  height: number,
  radius = 4,
): string {
  const r = Math.min(radius, width / 2, height)
  const bottom = top + height
  return `M${x},${bottom} V${top + r} Q${x},${top} ${x + r},${top} H${x + width - r} Q${x + width},${top} ${x + width},${top + r} V${bottom} Z`
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
