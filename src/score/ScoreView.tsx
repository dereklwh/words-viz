import { line, curveCatmullRom } from 'd3-shape'
import { motion } from 'motion/react'
import type { Focus } from '../views/types'
import type { PlacedNote, ScoreLayout } from './layout'
import { arrival } from './timing'
import { DRAW, EASE_IN_OUT, SPRING_NOTE } from '../theme/motion'

interface Props {
  layout: ScoreLayout
  /** Animate notes in as words land; false renders the settled score. */
  entrance: boolean
  focus?: Focus | null
  onFocus?: (focus: Focus | null) => void
}

const contourPath = line().curve(curveCatmullRom.alpha(0.5))

const WORD_GAP = 3
const BEAD_GAP = 1.5

function NoteGlyph({ placed, space }: { placed: PlacedNote; space: number }) {
  const { note, x, width, y } = placed
  const height = space * 0.9
  const inner = width - WORD_GAP
  const bead = inner / note.syllables
  // CSS variables only resolve in `style`, not in SVG presentation attributes.
  const color = `var(--degree-${note.degree})`
  return (
    <>
      {note.stress.map((stress, i) => (
        <rect
          key={i}
          x={x + WORD_GAP / 2 + i * bead}
          y={y - height / 2}
          width={Math.max(1, bead - BEAD_GAP)}
          height={height}
          rx={Math.min(height / 2, (bead - BEAD_GAP) / 2)}
          style={{ fill: color, fillOpacity: stress > 0 ? 1 : 0.32 }}
        />
      ))}
      {note.accent && (
        <path
          d={`M ${x + width / 2 - 3.5} ${y - space * 1.35} l 7 2.5 l -7 2.5`}
          fill="none"
          style={{ stroke: color }}
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </>
  )
}

export function ScoreView({ layout, entrance, focus = null, onFocus }: Props) {
  const { staffSpace: space, width } = layout
  const staffHeight = space * 4
  const total = layout.notes.length

  return (
    <svg
      className="score"
      width={width}
      height={layout.height}
      viewBox={`0 0 ${width} ${layout.height}`}
      role="img"
      aria-label={`Score of ${total} notes in ${layout.bars.length} phrases`}
    >
      {layout.systems.map((system) => (
        <g key={system.index} className="staff">
          {[0, 1, 2, 3, 4].map((line) => (
            <line
              key={line}
              x1={0}
              x2={width}
              y1={system.top + line * space}
              y2={system.top + line * space}
            />
          ))}
          {total > 0 && (
            <text className="measure-number" x={0} y={system.top - space * 0.8}>
              {system.measure}
            </text>
          )}
        </g>
      ))}

      {layout.contours.map((c, i) => (
        <motion.path
          key={i}
          className="contour"
          d={contourPath(c.points) ?? undefined}
          initial={entrance ? { pathLength: 0, opacity: 0 } : false}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: DRAW, delay: entrance ? DRAW + i * 0.05 : 0, ease: EASE_IN_OUT }}
        />
      ))}

      {layout.bars.map((bar, i) => {
        const top = layout.systems[bar.system].top
        return (
          <g key={i} className={`bar bar-${bar.kind}`}>
            <line x1={bar.x} x2={bar.x} y1={top} y2={top + staffHeight} />
            {bar.kind !== 'single' && (
              <line
                className={bar.kind === 'final' ? 'heavy' : undefined}
                x1={bar.x + (bar.kind === 'final' ? 4 : 3)}
                x2={bar.x + (bar.kind === 'final' ? 4 : 3)}
                y1={top}
                y2={top + staffHeight}
              />
            )}
          </g>
        )
      })}

      {layout.rests.map((r) => (
        <rect
          key={r.key}
          className="rest"
          x={r.x + WORD_GAP}
          y={r.y - space * 0.22}
          width={Math.max(2, r.width - WORD_GAP * 2)}
          height={space * 0.44}
          rx={space * 0.22}
        />
      ))}

      {layout.ties.map((t, i) => (
        <path
          key={i}
          className="tie"
          d={`M ${t.x1 - 5} ${t.y} Q ${(t.x1 + t.x2) / 2} ${t.y - space * 0.6} ${t.x2 + 5} ${t.y}`}
        />
      ))}

      {layout.notes.map((placed) => (
        <motion.g
          key={placed.key}
          data-note={placed.key}
          onPointerEnter={() =>
            onFocus?.({
              phrase: Number(placed.key.split(':')[0]),
              key: placed.key,
              x: placed.x + placed.width / 2,
              y: placed.y - space,
              value: `“${placed.note.text}”`,
              label: `${placed.note.syllables} syllable${placed.note.syllables === 1 ? '' : 's'}`,
            })
          }
          onPointerLeave={() => onFocus?.(null)}
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'center',
            opacity: focus && focus.key !== placed.key ? 0.35 : undefined,
          }}
          initial={entrance ? { opacity: 0, scale: 0.4 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            ...SPRING_NOTE,
            delay: entrance ? arrival(placed.order, total) : 0,
          }}
        >
          <title>{placed.note.text}</title>
          <NoteGlyph placed={placed} space={space} />
        </motion.g>
      ))}
    </svg>
  )
}
