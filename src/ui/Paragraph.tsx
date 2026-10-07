import type { CSSProperties, ReactNode, Ref } from 'react'
import type { Score } from '../analysis'
import { noteKey } from '../score/layout'
import { arrival } from '../score/timing'
import type { WordTint } from '../views'
import type { Focus } from '../views/types'

interface Props {
  text: string
  score: Score | null
  tint: WordTint | null
  focus: Focus | null
  entrance: boolean
  onChange: (text: string) => void
  onSubmit: () => void
  ref?: Ref<HTMLDivElement>
}

function wordClass(focus: Focus | null, phrase: number, key: string): string {
  if (!focus) return 'word'
  if (focus.key === key) return 'word lit'
  return focus.phrase === phrase && !focus.key ? 'word' : 'word dim'
}

function renderWords(
  text: string,
  score: Score,
  tint: WordTint,
  focus: Focus | null,
  entrance: boolean,
) {
  const total = score.phrases.reduce((a, p) => a + p.words, 0)
  const parts: ReactNode[] = []
  let cursor = 0
  let order = 0
  for (const phrase of score.phrases) {
    phrase.events.forEach((event, i) => {
      if (event.kind !== 'note') return
      if (event.start > cursor) parts.push(text.slice(cursor, event.start))
      const key = noteKey(phrase.index, i)
      const style = {
        '--tint': tint(phrase, event),
        animationDelay: entrance ? `${arrival(order, total)}s` : '0s',
      } as CSSProperties
      parts.push(
        <span
          key={key}
          data-word={key}
          className={wordClass(focus, phrase.index, key)}
          style={style}
        >
          {text.slice(event.start, event.end)}
        </span>,
      )
      order++
      cursor = event.end
    })
  }
  parts.push(text.slice(cursor))
  return parts
}

/**
 * The textarea and the analyzed paragraph share one grid cell and identical type,
 * so words stay exactly where they were typed when the chart takes over.
 */
export function Paragraph({ text, score, tint, focus, entrance, onChange, onSubmit, ref }: Props) {
  return (
    <div className="paragraph" data-value={`${text} `} ref={ref}>
      {score && tint ? (
        <div className="paragraph-text paragraph-scored">
          {renderWords(text, score, tint, focus, entrance)}
        </div>
      ) : (
        <textarea
          className="paragraph-text"
          value={text}
          placeholder="Paste a paragraph here."
          aria-label="Paragraph to analyze"
          spellCheck={false}
          autoFocus
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSubmit()
          }}
        />
      )}
    </div>
  )
}
