import { motion } from 'motion/react'
import { createPortal } from 'react-dom'
import { FLIGHT } from '../score/timing'

export interface Ghost {
  key: string
  text: string
  left: number
  top: number
  /** Translation from the word's origin to its note's center. */
  dx: number
  dy: number
  degree: number
  delay: number
}

interface Props {
  ghosts: Ghost[]
  onDone: () => void
}

/** Copies of each word that lift off the paragraph and settle into their notes. */
export function Flight({ ghosts, onDone }: Props) {
  const lastDelay = Math.max(0, ...ghosts.map((g) => g.delay))
  // Portaled to <body> so absolute positions are document coordinates.
  return createPortal(
    <div className="flight" aria-hidden>
      {ghosts.map((g) => (
        <motion.span
          key={g.key}
          className="paragraph-text ghost"
          style={{ left: g.left, top: g.top, color: `var(--degree-${g.degree})` }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 0 }}
          animate={{ x: g.dx, y: g.dy, scale: 0.3, opacity: [0, 1, 1, 0] }}
          transition={{
            delay: g.delay,
            duration: FLIGHT,
            ease: [0.65, 0, 0.35, 1],
            opacity: { delay: g.delay, duration: FLIGHT, times: [0, 0.1, 0.75, 1] },
          }}
          onAnimationComplete={g.delay === lastDelay ? onDone : undefined}
        >
          {g.text}
        </motion.span>
      ))}
    </div>,
    document.body,
  )
}
