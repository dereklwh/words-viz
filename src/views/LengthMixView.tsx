import { motion } from 'motion/react'
import { arrival } from '../score/timing'
import type { LengthMixLayout } from './lengthMix'
import { plural, type ViewProps } from './props'

const HIT_MIN = 12

export function LengthMixView({
  layout,
  entrance,
  total,
  focus,
  onFocus,
}: ViewProps<LengthMixLayout>) {
  const { width, height, baseline, dots, bins, labelY } = layout
  return (
    <svg className="chart-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <line className="axis" x1={0} x2={width} y1={baseline} y2={baseline} />
      {bins.map((b) => (
        <text key={b.label} className="chart-label" x={b.x} y={labelY} textAnchor="middle">
          {b.label}
        </text>
      ))}
      <text className="chart-caption" x={width / 2} y={labelY + 16} textAnchor="middle">
        words per sentence
      </text>

      {dots.map((d) => {
        const dimmed = focus !== null && focus.phrase !== d.phrase
        const show = () =>
          onFocus({
            phrase: d.phrase,
            x: d.cx,
            y: d.cy - d.r,
            value: plural(d.words, 'word'),
            label: `Sentence ${d.phrase + 1}`,
          })
        return (
          <g
            key={d.phrase}
            className="mark"
            tabIndex={0}
            aria-label={`Sentence ${d.phrase + 1}: ${plural(d.words, 'word')}`}
            onPointerEnter={show}
            onFocus={show}
            onPointerLeave={() => onFocus(null)}
            onBlur={() => onFocus(null)}
            style={{ opacity: dimmed ? 0.3 : 1 }}
          >
            <circle className="hit" cx={d.cx} cy={d.cy} r={Math.max(HIT_MIN, d.r + 3)} />
            <motion.circle
              cx={d.cx}
              cy={d.cy}
              r={d.r}
              style={{
                fill: `var(--bin-${d.bin + 1})`,
                stroke: 'var(--paper)',
                strokeWidth: 2,
                transformBox: 'fill-box',
                transformOrigin: 'center',
              }}
              initial={entrance ? { scale: 0 } : false}
              animate={{ scale: 1 }}
              transition={{
                delay: entrance ? arrival(d.lastOrder, total) : 0,
                type: 'spring',
                stiffness: 420,
                damping: 18,
              }}
            />
          </g>
        )
      })}
    </svg>
  )
}
