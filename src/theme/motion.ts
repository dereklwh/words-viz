// JS twin of tokens.css for motion values that animate through `motion`, not CSS.
import type { Transition } from 'motion/react'

/** Matches `--ease-out`. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const

/** Seconds. */
export const FADE = 0.3
export const ANNOTATION_FADE = 0.5
export const DRAW = 1.2

export const SPRING_NOTE: Transition = { type: 'spring', stiffness: 420, damping: 26 }
export const SPRING_BAR: Transition = { type: 'spring', stiffness: 380, damping: 22 }
export const SPRING_DOT: Transition = { type: 'spring', stiffness: 420, damping: 18 }
