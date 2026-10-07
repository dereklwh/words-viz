import { motion } from 'motion/react'
import type { PointerEvent } from 'react'
import { arrival } from '../score/timing'
import { plural, type ViewProps } from './props'
import type { WaveformLayout } from './waveform'

export function WaveformView({
  layout,
  entrance,
  total,
  focus,
  onFocus,
}: ViewProps<WaveformLayout>) {
  const { width, height, rows, bars } = layout

  // Bars are too thin to aim at, so the pointer picks the nearest bar in its row.
  function track(event: PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - box.left
    const y = event.clientY - box.top
    const row = rows.reduce(
      (best, r) => (Math.abs(r.y - y) < Math.abs(best.y - y) ? r : best),
      rows[0],
    )
    let nearest = undefined as (typeof bars)[number] | undefined
    for (const bar of bars) {
      if (bar.y !== row.y) continue
      if (!nearest || Math.abs(bar.x - x) < Math.abs(nearest.x - x)) nearest = bar
    }
    if (!nearest || Math.abs(nearest.x - x) > 12) return onFocus(null)
    onFocus({
      phrase: nearest.phrase,
      key: nearest.key,
      x: nearest.x + nearest.width / 2,
      y: nearest.y - nearest.amplitude,
      value: `“${nearest.text}”`,
      label: plural(nearest.syllables, 'syllable'),
    })
  }

  return (
    <svg
      className="chart-svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      onPointerMove={track}
      onPointerLeave={() => onFocus(null)}
    >
      {rows.map((r) => (
        <line key={r.y} className="axis" x1={0} x2={r.end} y1={r.y} y2={r.y} />
      ))}
      {bars.map((b, i) => {
        const dimmed =
          focus !== null && (focus.key ? focus.key !== b.key : focus.phrase !== b.phrase)
        return (
          <motion.rect
            key={i}
            x={b.x}
            y={b.y - b.amplitude}
            width={b.width}
            height={b.amplitude * 2}
            rx={b.width / 2}
            style={{
              fill: b.accent ? 'var(--mark-emphasis)' : 'var(--mark)',
              fillOpacity: (b.faint ? 0.45 : 1) * (dimmed ? 0.3 : 1),
              transformBox: 'fill-box',
              transformOrigin: 'center',
            }}
            initial={entrance ? { scaleY: 0 } : false}
            animate={{ scaleY: 1 }}
            transition={{
              delay: entrance ? arrival(b.order, total) : 0,
              type: 'spring',
              stiffness: 380,
              damping: 22,
            }}
          />
        )
      })}
    </svg>
  )
}
