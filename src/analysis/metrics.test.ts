import { describe, expect, it } from 'vitest'
import { longestRun } from './metrics'

describe('longestRun', () => {
  it('finds consecutive sentences within one word of the run start', () => {
    expect(longestRun([3, 12, 5, 6, 5, 4, 20])).toEqual({ start: 2, length: 4 })
  })

  it('prefers the earliest run on ties', () => {
    expect(longestRun([2, 2, 9, 9])).toEqual({ start: 0, length: 2 })
  })

  it('handles empty and single inputs', () => {
    expect(longestRun([])).toEqual({ start: 0, length: 0 })
    expect(longestRun([7])).toEqual({ start: 0, length: 1 })
  })
})
