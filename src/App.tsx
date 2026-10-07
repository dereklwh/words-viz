import { useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { analyze, loadLexicon, type Lexicon, type Score } from './analysis'
import { PROVOST } from './analysis/fixtures/provost'
import { defaultOptions, layoutScore, type ScoreLayout } from './score/layout'
import { ScoreView } from './score/ScoreView'
import { departure } from './score/timing'
import { Flight, type Ghost } from './ui/Flight'
import { Paragraph } from './ui/Paragraph'
import { useElementWidth } from './ui/useElementWidth'
import './ui/app.css'

const EMPTY_LAYOUT_SCORE: Score = {
  text: '',
  phrases: [],
  metrics: {} as Score['metrics'],
}

function emptyStaff(width: number): ScoreLayout {
  const options = defaultOptions(width)
  return {
    ...layoutScore(EMPTY_LAYOUT_SCORE, options),
    height: options.marginTop * 2 + options.staffSpace * 4,
    systems: [{ index: 0, top: options.marginTop, end: options.indent, measure: 1 }],
  }
}

function measureGhosts(paragraph: HTMLElement, svg: SVGSVGElement, layout: ScoreLayout): Ghost[] {
  const origin = svg.getBoundingClientRect()
  const total = layout.notes.length
  return layout.notes.flatMap((placed) => {
    const word = paragraph.querySelector<HTMLElement>(`[data-word="${placed.key}"]`)
    if (!word) return []
    const from = word.getBoundingClientRect()
    return [
      {
        key: placed.key,
        text: word.textContent ?? '',
        // Document coordinates, so ghosts and notes scroll together.
        left: from.left + window.scrollX,
        top: from.top + window.scrollY,
        dx: origin.left + placed.x + placed.width / 2 - (from.left + from.width / 2),
        dy: origin.top + placed.y - (from.top + from.height / 2),
        degree: placed.note.degree,
        delay: departure(placed.order, total),
      },
    ]
  })
}

/** Brings the score into view while words are in flight, if it starts below the fold. */
function revealScore(svg: SVGSVGElement) {
  const box = svg.getBoundingClientRect()
  if (box.top < window.innerHeight * 0.6) return
  const top = window.scrollY + box.top - window.innerHeight * 0.3
  window.scrollTo({ top, behavior: 'smooth' })
}

export default function App() {
  const [text, setText] = useState('')
  const [score, setScore] = useState<Score | null>(null)
  const [entrance, setEntrance] = useState(false)
  const [ghosts, setGhosts] = useState<Ghost[]>([])
  const [loading, setLoading] = useState(false)
  const lexicon = useRef<Promise<Lexicon> | null>(null)
  const paragraphRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const width = useElementWidth(stageRef)

  useEffect(() => {
    lexicon.current = loadLexicon()
  }, [])

  const layout = useMemo(() => {
    if (width === 0) return null
    return score ? layoutScore(score, defaultOptions(width)) : emptyStaff(width)
  }, [score, width])

  const measuredFor = useRef<Score | null>(null)
  useLayoutEffect(() => {
    if (!entrance || reduceMotion || !score || !layout || !paragraphRef.current) return
    // Once per analysis; a resize mid-flight just lets the ghosts settle where they were headed.
    if (measuredFor.current === score) return
    measuredFor.current = score
    const svg = stageRef.current?.querySelector('svg')
    if (!svg) return
    setGhosts(measureGhosts(paragraphRef.current, svg, layout))
    revealScore(svg)
  }, [score, entrance, reduceMotion, layout])

  async function showRhythm() {
    if (!text.trim() || loading) return
    setLoading(true)
    const result = analyze(text, await (lexicon.current ?? loadLexicon()))
    setLoading(false)
    if (result.phrases.length === 0) return
    setEntrance(true)
    setScore(result)
  }

  function edit() {
    setScore(null)
    setGhosts([])
    setEntrance(false)
  }

  return (
    <main className="app">
      <header className="masthead">words-viz</header>

      <section className="composer">
        <h1>How does your paragraph sound?</h1>
        <Paragraph
          ref={paragraphRef}
          text={text}
          score={score}
          entrance={entrance && !reduceMotion}
          onChange={setText}
          onSubmit={showRhythm}
        />
        <div className="actions">
          {score ? (
            <button className="button" onClick={edit}>
              Edit text
            </button>
          ) : (
            <>
              <button className="button" onClick={showRhythm} disabled={!text.trim() || loading}>
                {loading ? 'Loading dictionary…' : 'Show the rhythm'}
              </button>
              <button className="link" onClick={() => setText(PROVOST)}>
                Use Gary Provost’s paragraph
              </button>
            </>
          )}
        </div>
      </section>

      <section className="stage" ref={stageRef} aria-live="polite">
        {layout && (
          <ScoreView
            key={score ? 'score' : 'empty'}
            layout={layout}
            entrance={entrance && !reduceMotion}
          />
        )}
        <p className="legend">
          Each sentence is a phrase. Longer words hold longer notes, stressed syllables are solid,
          and punctuation rests.
        </p>
      </section>

      {ghosts.length > 0 && <Flight ghosts={ghosts} onDone={() => setGhosts([])} />}
    </main>
  )
}
