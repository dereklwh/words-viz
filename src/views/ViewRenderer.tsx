import { ScoreView } from '../score/ScoreView'
import type { AnyLayout } from '.'
import { LengthMixView } from './LengthMixView'
import { PulseView } from './PulseView'
import type { ViewProps } from './props'
import { WaveformView } from './WaveformView'

type Props = Omit<ViewProps<unknown>, 'layout'> & { chart: AnyLayout }

export function ViewRenderer({ chart, ...rest }: Props) {
  switch (chart.view) {
    case 'pulse':
      return <PulseView layout={chart.layout} {...rest} />
    case 'waveform':
      return <WaveformView layout={chart.layout} {...rest} />
    case 'mix':
      return <LengthMixView layout={chart.layout} {...rest} />
    case 'score':
      return <ScoreView layout={chart.layout} {...rest} />
  }
}
