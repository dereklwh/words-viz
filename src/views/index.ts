import type { Note, Phrase, Score } from '../analysis'
import { lengthBin } from '../analysis/insights'
import { computeMetrics } from '../analysis/metrics'
import { defaultOptions, emptyStaffLayout, layoutScore, type ScoreLayout } from '../score/layout'
import { layoutLengthMix, type LengthMixLayout } from './lengthMix'
import { layoutPulse, type PulseLayout } from './pulse'
import type { Targets } from './types'
import { layoutWaveform, type WaveformLayout } from './waveform'

export type ViewId = 'pulse' | 'waveform' | 'mix' | 'score'

export interface LegendKey {
  color: string
  label: string
  opacity?: number
}

export const VIEWS: { id: ViewId; label: string; legend: string; keys?: LegendKey[] }[] = [
  {
    id: 'pulse',
    label: 'Pulse',
    legend: 'Each bar is a sentence, measured in words.',
    keys: [
      { color: 'var(--mark)', label: 'Sentence' },
      { color: 'var(--mark-emphasis)', label: 'Run of similar lengths' },
    ],
  },
  {
    id: 'waveform',
    label: 'Waveform',
    legend: 'Each bar is a word: taller means more syllables. Gaps are punctuation.',
    keys: [
      { color: 'var(--mark)', label: 'Word' },
      { color: 'var(--mark)', label: 'Small word', opacity: 0.35 },
      { color: 'var(--mark-emphasis)', label: 'Stressed word a phrase leans on' },
    ],
  },
  {
    id: 'mix',
    label: 'Length mix',
    legend: 'Each dot is a sentence, grouped by how many words it has.',
  },
  {
    id: 'score',
    label: 'Score',
    legend:
      'Each sentence is a phrase. Longer words hold longer notes, stressed syllables are solid, and punctuation rests.',
  },
]

export const isViewId = (value: unknown): value is ViewId => VIEWS.some((v) => v.id === value)

export type AnyLayout =
  | { view: 'pulse'; layout: PulseLayout }
  | { view: 'waveform'; layout: WaveformLayout }
  | { view: 'mix'; layout: LengthMixLayout }
  | { view: 'score'; layout: ScoreLayout }

const EMPTY: Score = { text: '', phrases: [], metrics: computeMetrics([]) }

export function layoutFor(view: ViewId, score: Score | null, width: number): AnyLayout {
  const s = score ?? EMPTY
  switch (view) {
    case 'pulse':
      return { view, layout: layoutPulse(s, width) }
    case 'waveform':
      return { view, layout: layoutWaveform(s, width) }
    case 'mix':
      return { view, layout: layoutLengthMix(s, width) }
    case 'score':
      return {
        view,
        layout: score ? layoutScore(score, defaultOptions(width)) : emptyStaffLayout(width),
      }
  }
}

export function targetsOf(any: AnyLayout): Targets {
  if (any.view !== 'score') return any.layout.targets
  return Object.fromEntries(any.layout.notes.map((n) => [n.key, [n.x + n.width / 2, n.y]]))
}

/** The colour a word wears in the paragraph and in flight, matching its mark in the view. */
export type WordTint = (phrase: Phrase, note: Note) => string

export function wordTint(view: ViewId, score: Score): WordTint {
  const { longestRun } = score.metrics
  const inRun = (p: Phrase) =>
    longestRun.length >= 3 &&
    p.index >= longestRun.start &&
    p.index < longestRun.start + longestRun.length
  switch (view) {
    case 'pulse':
      return (p) => (inRun(p) ? 'var(--mark-emphasis)' : 'var(--mark)')
    case 'waveform':
      return (_, n) =>
        n.accent
          ? 'var(--mark-emphasis)'
          : n.isFunctionWord
            ? 'color-mix(in oklch, var(--mark) 35%, transparent)'
            : 'var(--mark)'
    case 'mix':
      return (p) => `var(--bin-${lengthBin(p.words) + 1})`
    case 'score':
      return (_, n) => `var(--degree-${n.degree})`
  }
}
