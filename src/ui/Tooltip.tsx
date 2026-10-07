import type { Focus } from '../views/types'

/** Value first, label second; React text nodes keep word text inert. */
export function Tooltip({ focus }: { focus: Focus }) {
  return (
    <div className="tooltip" style={{ left: focus.x, top: focus.y }} role="status">
      <strong>{focus.value}</strong>
      <span>{focus.label}</span>
    </div>
  )
}
