import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { analyze, loadLexicon, type Lexicon, type Score } from './analysis'
import { PROVOST } from './analysis/fixtures/provost'
import { describeRhythm } from './analysis/insights'
import { pickSample, sampleFor } from './samples'
import { departure } from './score/timing'
import { FADE } from './theme/motion'
import { Flight, type Ghost } from './ui/Flight'
import { Legend } from './ui/Legend'
import { Paragraph } from './ui/Paragraph'
import { Tooltip } from './ui/Tooltip'
import { useElementWidth } from './ui/useElementWidth'
import { ViewSwitcher } from './ui/ViewSwitcher'
import {
  isViewId,
  layoutFor,
  targetsOf,
  VIEWS,
  wordTint,
  type ViewId,
  type WordTint,
} from './views'
import { orderedNotes, type Focus, type Targets } from './views/types'
import { ViewRenderer } from './views/ViewRenderer'
import './ui/app.css'

const VIEW_STORAGE_KEY = 'words-viz:view'

function storedView(): ViewId {
  try {
    const value = localStorage.getItem(VIEW_STORAGE_KEY)
    return isViewId(value) ? value : 'pulse'
  } catch {
    return 'pulse'
  }
}

function measureGhosts(
  paragraph: HTMLElement,
  svg: SVGSVGElement,
  score: Score,
  targets: Targets,
  tint: WordTint,
): Ghost[] {
  const origin = svg.getBoundingClientRect()
  const notes = orderedNotes(score)
  return notes.flatMap(({ key, phrase, note, order }) => {
    const word = paragraph.querySelector<HTMLElement>(`[data-word="${key}"]`)
    const target = targets[key]
    if (!word || !target) return []
    const from = word.getBoundingClientRect()
    return [
      {
        key,
        text: word.textContent ?? '',
        // Document coordinates, so ghosts and marks scroll together.
        left: from.left + window.scrollX,
        top: from.top + window.scrollY,
        dx: origin.left + target[0] - (from.left + from.width / 2),
        dy: origin.top + target[1] - (from.top + from.height / 2),
        height: from.height,
        color: tint(score.phrases[phrase], note),
        delay: departure(order, notes.length),
      },
    ]
  })
}

/** Brings the chart into view while words are in flight, if it starts below the fold. */
function revealChart(svg: SVGSVGElement) {
  const box = svg.getBoundingClientRect()
  if (box.top < window.innerHeight * 0.6) return
  const top = window.scrollY + box.top - window.innerHeight * 0.3
  window.scrollTo({ top, behavior: 'smooth' })
}

export default function App() {
  const [text, setText] = useState('')
  const [score, setScore] = useState<Score | null>(null)
  const [view, setView] = useState<ViewId>(storedView)
  const [entrance, setEntrance] = useState(false)
  const [ghosts, setGhosts] = useState<Ghost[]>([])
  const [focus, setFocus] = useState<Focus | null>(null)
  const [loading, setLoading] = useState(false)
  const [shuffles, setShuffles] = useState(0)
  const lexicon = useRef<Promise<Lexicon> | null>(null)
  const paragraphRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const width = useElementWidth(chartRef)
  const animate = entrance && !reduceMotion

  useEffect(() => {
    lexicon.current = loadLexicon()
  }, [])

  const chart = useMemo(() => (width ? layoutFor(view, score, width) : null), [view, score, width])
  const tint = useMemo(() => (score ? wordTint(view, score) : null), [view, score])
  const total = score ? orderedNotes(score).length : 0
  const viewInfo = VIEWS.find((v) => v.id === view)!
  const sample = sampleFor(score?.text ?? text)

  const measuredFor = useRef<Score | null>(null)
  useLayoutEffect(() => {
    if (!animate || !score || !chart || !tint || !paragraphRef.current) return
    // Once per analysis; a resize mid-flight just lets the ghosts settle where they were headed.
    if (measuredFor.current === score) return
    measuredFor.current = score
    const svg = chartRef.current?.querySelector('svg')
    if (!svg) return
    setGhosts(measureGhosts(paragraphRef.current, svg, score, targetsOf(chart), tint))
    revealChart(svg)
  }, [animate, score, chart, tint])

  async function showRhythm() {
    if (!text.trim() || loading) return
    setLoading(true)
    let result: Score
    try {
      result = analyze(text, await (lexicon.current ?? loadLexicon()))
    } catch {
      // Dictionary failed to load (offline?); heuristic syllables still make a fair score.
      lexicon.current = null
      result = analyze(text)
    } finally {
      setLoading(false)
    }
    if (result.phrases.length === 0) return
    setEntrance(true)
    setScore(result)
  }

  function edit() {
    setScore(null)
    setGhosts([])
    setFocus(null)
    setEntrance(false)
  }

  function trySample() {
    if (score) edit()
    setText(pickSample(sample?.id).text)
    setShuffles((n) => n + 1)
  }

  function loadProvost() {
    if (score) edit()
    setText(PROVOST)
  }

  function switchView(next: ViewId) {
    setView(next)
    setEntrance(false)
    setGhosts([])
    setFocus(null)
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next)
    } catch {
      // Storage can be unavailable (private mode); the choice just won't persist.
    }
  }

  return (
    <main className="app">
      <header className="masthead">words-viz</header>

      <section className="composer">
        <h1>How does your paragraph sound?</h1>
        {/* Above the paragraph so the links stay put while the text below changes length. */}
        <p className="starters">
          <span className="starters-lead">Try</span>
          <button className="link" onClick={loadProvost}>
            Gary Provost’s paragraph
          </button>
          <span className="sep" aria-hidden>
            ·
          </span>
          <button
            className="link shuffle"
            style={{ '--turns': shuffles } as CSSProperties}
            onClick={trySample}
          >
            {sample ? 'another classic' : 'a random classic'}
            <span className="shuffle-glyph" aria-hidden>
              ↻
            </span>
          </button>
        </p>
        <Paragraph
          ref={paragraphRef}
          text={text}
          score={score}
          tint={tint}
          focus={focus}
          entrance={animate}
          onChange={setText}
          onSubmit={showRhythm}
        />
        {sample && (
          <p key={sample.id} className="attribution">
            — {sample.author}, <cite>{sample.work}</cite>, {sample.year}
          </p>
        )}
        <div className="actions">
          {score ? (
            <button className="button" onClick={edit}>
              Edit text
            </button>
          ) : (
            <button className="button" onClick={showRhythm} disabled={!text.trim() || loading}>
              {loading ? 'Loading dictionary…' : 'Show the rhythm'}
            </button>
          )}
        </div>
      </section>

      <section className="stage" aria-live="polite">
        {score && <p className="headline">{describeRhythm(score.metrics)}</p>}
        <ViewSwitcher value={view} onChange={switchView} />

        <div className="chart" ref={chartRef}>
          {chart && (
            <motion.div
              key={`${view}:${score ? 'scored' : 'empty'}`}
              initial={animate ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: FADE }}
            >
              <ViewRenderer
                chart={chart}
                entrance={animate}
                total={total}
                focus={focus}
                onFocus={setFocus}
              />
            </motion.div>
          )}
          {focus && <Tooltip focus={focus} />}
        </div>

        <Legend text={viewInfo.legend} keys={score ? viewInfo.keys : undefined} />

        {score && (
          <table className="visually-hidden">
            <caption>Sentence lengths</caption>
            <thead>
              <tr>
                <th>Sentence</th>
                <th>Words</th>
                <th>Syllables</th>
              </tr>
            </thead>
            <tbody>
              {score.phrases.map((p) => (
                <tr key={p.index}>
                  <td>{p.text}</td>
                  <td>{p.words}</td>
                  <td>{p.syllables}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {ghosts.length > 0 && <Flight ghosts={ghosts} onDone={() => setGhosts([])} />}
    </main>
  )
}
