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
  const { width, height, labelWidth, dots, rows } = layout
  return (
    <svg className="chart-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {rows.map((row) => (
        <g key={row.name}>
          <line
            className="track"
            x1={row.count > 0 ? row.countX + 20 : labelWidth}
            x2={width}
            y1={row.centerY}
            y2={row.centerY}
          />
          <text className="mix-name" x={0} y={row.centerY - 2}>
            {row.name}
          </text>
          <text className="mix-range" x={0} y={row.centerY + 12}>
            {row.range}
          </text>
          {row.count > 0 && (
            <text className="chart-label" x={row.countX} y={row.centerY + 4}>
              {row.count}
            </text>
          )}
        </g>
      ))}

      {dots.map((d) => {
        const dimmed = focus !== null && focus.phrase !== d.phrase
        const show = () =>
          onFocus({
            phrase: d.phrase,
            x: d.cx,
            y: d.cy - d.r,
            value: plural(d.words, 'word'),
            label: `“${d.text}”`,
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
