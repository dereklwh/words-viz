import { motion } from 'motion/react'
import { createPortal } from 'react-dom'
import { FLIGHT } from '../score/timing'
import { EASE_IN_OUT } from '../theme/motion'

export interface Ghost {
  key: string
  text: string
  left: number
  top: number
  /** Translation from the word's origin to its note's center. */
  dx: number
  dy: number
  /** The word's own box height; the ghost matches it so text doesn't shift. */
  height: number
  color: string
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
          style={{
            left: g.left,
            top: g.top,
            height: g.height,
            lineHeight: `${g.height}px`,
            color: g.color,
          }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 0 }}
          animate={{ x: g.dx, y: g.dy, scale: 0.3, opacity: [0, 1, 1, 0] }}
          transition={{
            delay: g.delay,
            duration: FLIGHT,
            ease: EASE_IN_OUT,
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
