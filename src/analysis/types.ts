/** Offsets into `Score.text`, end-exclusive. */
export interface Span {
  start: number
  end: number
}

/** CMU stress levels: 0 unstressed, 1 primary, 2 secondary. */
export type Stress = 0 | 1 | 2

export type RestKind = 'comma' | 'pause' | 'dash' | 'ellipsis'

export type Cadence = 'full' | 'question' | 'exclamation' | 'trailing' | 'open'

export interface Note extends Span {
  kind: 'note'
  text: string
  syllables: number
  stress: Stress[]
  isFunctionWord: boolean
  /** Pronunciation came from heuristics, not the dictionary. */
  guessed: boolean
  /** Joined to the previous note by a hyphen. */
  tie: boolean
  /** Nuclear stress: the last content word before a rest. */
  accent: boolean
  beats: number
  /** Scale degree, 0 (tonic) to 7 (octave). */
  degree: number
}

export interface Rest extends Span {
  kind: 'rest'
  rest: RestKind | 'cadence'
  mark: string
  beats: number
}

export type ScoreEvent = Note | Rest

export interface Phrase extends Span {
  index: number
  text: string
  events: ScoreEvent[]
  words: number
  syllables: number
  beats: number
  cadence: Cadence
  endsParagraph: boolean
}

export interface Metrics {
  sentences: number
  words: number
  syllables: number
  beats: number
  /** Words per sentence, in order — the paragraph's melody. */
  lengths: number[]
  meanLength: number
  stdevLength: number
  /** Coefficient of variation of sentence length; 0 is a drone. */
  variety: number
  /** Longest run of consecutive sentences within one word of each other. */
  longestRun: { start: number; length: number }
  syllablesPerWord: number
}

export interface Score {
  text: string
  phrases: Phrase[]
  metrics: Metrics
}

/** Looks up a lowercase word, returning ARPAbet phonemes ("S EH1 N T AH0 N S"). */
export type Lexicon = (word: string) => string | undefined
