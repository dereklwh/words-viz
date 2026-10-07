import { motion } from 'motion/react'
import { arrival } from '../score/timing'
import type { PulseLayout } from './pulse'
import { columnPath, plural, type ViewProps } from './props'

const HIT_MIN = 24

export function PulseView({ layout, entrance, total, focus, onFocus }: ViewProps<PulseLayout>) {
  const { width, height, baseline, columns } = layout
  const settle = entrance ? arrival(total - 1, total) + 0.2 : 0

  return (
    <svg className="chart-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <line className="axis" x1={0} x2={width} y1={baseline} y2={baseline} />

      {columns.map((c) => {
        const start = entrance ? arrival(c.firstOrder, total) : 0
        const duration = entrance ? arrival(c.lastOrder, total) - start + 0.35 : 0
        const dimmed = focus !== null && focus.phrase !== c.phrase
        const hitWidth = Math.max(HIT_MIN, c.width + 8)
        const show = () =>
          onFocus({
            phrase: c.phrase,
            x: c.x + c.width / 2,
            y: c.top,
            value: plural(c.words, 'word'),
            label: `Sentence ${c.phrase + 1}`,
          })
        return (
          <g
            key={c.phrase}
            className="mark"
            tabIndex={0}
            aria-label={`Sentence ${c.phrase + 1}: ${plural(c.words, 'word')}`}
            onPointerEnter={show}
            onFocus={show}
            onPointerLeave={() => onFocus(null)}
            onBlur={() => onFocus(null)}
            style={{ opacity: dimmed ? 0.3 : 1 }}
          >
            <rect
              className="hit"
              x={c.x + c.width / 2 - hitWidth / 2}
              y={0}
              width={hitWidth}
              height={baseline}
            />
            <motion.path
              d={columnPath(c.x, c.top, c.width, c.height)}
              style={{
                fill: c.emphasis ? 'var(--mark-emphasis)' : 'var(--mark)',
                transformBox: 'fill-box',
                transformOrigin: '50% 100%',
              }}
              initial={entrance ? { scaleY: 0 } : false}
              animate={{ scaleY: 1 }}
              transition={{ delay: start, duration, ease: [0.22, 1, 0.36, 1] }}
            />
          </g>
        )
      })}

      <motion.g
        className="annotations"
        initial={entrance ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ delay: settle, duration: 0.5 }}
      >
        {layout.mean && (
          <>
            <line className="reference" x1={0} x2={width} y1={layout.mean.y} y2={layout.mean.y} />
            <text
              className="chart-label"
              x={layout.mean.x}
              y={layout.mean.y - 6}
              textAnchor={layout.mean.anchor}
            >
              {layout.mean.label}
            </text>
          </>
        )}
        {layout.labels.map((l) => (
          <text key={`${l.x}`} className="chart-value" x={l.x} y={l.y} textAnchor="middle">
            {l.text}
          </text>
        ))}
        {layout.run && (
          <>
            <path
              className="bracket"
              d={`M${layout.run.x1},${layout.run.y - 5} V${layout.run.y} H${layout.run.x2} V${layout.run.y - 5}`}
            />
            <text
              className="chart-label"
              x={(layout.run.x1 + layout.run.x2) / 2}
              y={layout.run.y + 15}
              textAnchor="middle"
            >
              {layout.run.label}
            </text>
          </>
        )}
      </motion.g>
    </svg>
  )
}
