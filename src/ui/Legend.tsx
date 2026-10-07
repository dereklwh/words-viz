import type { LegendKey } from '../views'

export function Legend({ text, keys = [] }: { text: string; keys?: LegendKey[] }) {
  return (
    <div className="legend">
      {keys.length > 0 && (
        <ul className="legend-keys">
          {keys.map((k) => (
            <li key={k.label}>
              <span
                className={`swatch swatch-${k.shape ?? 'square'}`}
                style={{
                  ...(k.shape === 'outline' ? { borderColor: k.color } : { background: k.color }),
                  opacity: k.opacity,
                }}
              />
              {k.label}
            </li>
          ))}
        </ul>
      )}
      <p>{text}</p>
    </div>
  )
}
