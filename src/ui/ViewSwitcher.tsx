import { VIEWS, type ViewId } from '../views'

interface Props {
  value: ViewId
  onChange: (view: ViewId) => void
}

export function ViewSwitcher({ value, onChange }: Props) {
  return (
    <div className="switcher" role="radiogroup" aria-label="Chart style">
      {VIEWS.map((view) => (
        <button
          key={view.id}
          role="radio"
          aria-checked={view.id === value}
          className="switcher-option"
          onClick={() => onChange(view.id)}
        >
          {view.label}
        </button>
      ))}
    </div>
  )
}
