import { describe, expect, it } from 'vitest'
import { SKILL_ORDER } from '../engine/generate'
import { holdsAt, solutionOf } from '../engine/solve'
import { moveInfo, moveNumber, MOVES, RARITY } from './moves'

/** Works out one side of a line of plain working, such as "12 − 5". */
function value(side: string): number {
  const sum = side.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
  if (!/^[\d\s+\-*/().]+$/.test(sum)) throw new Error(`Cannot work out "${side}"`)
  return Function(`"use strict"; return (${sum})`)() as number
}

describe('move cards', () => {
  it('make a set of twelve: five common, five rare and two holo, in that order', () => {
    expect(MOVES).toHaveLength(12)
    expect(new Set(MOVES.map((card) => card.id)).size).toBe(12)
    expect(new Set(MOVES.map((card) => card.name)).size).toBe(12)
    expect(MOVES.map((card) => RARITY[card.rarity].rank)).toEqual([0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2])
    expect(moveNumber('take-it-away')).toBe(1)
    expect(moveNumber('found-x')).toBe(12)
    expect(moveInfo('found-x').rarity).toBe('holo')
  })

  it('belong to real skills', () => {
    for (const card of MOVES) {
      if (card.skill !== null) expect(SKILL_ORDER).toContain(card.skill)
    }
  })

  it('show working where every line is true', () => {
    for (const card of MOVES) {
      const equations = card.working.filter((line) => typeof line !== 'string')
      expect(equations.length, card.id).toBeGreaterThan(0)
      const x = solutionOf(equations[0])
      for (const eq of equations) expect(holdsAt(eq, x), card.id).toBe(true)

      for (const line of card.working) {
        if (typeof line !== 'string') continue
        const tried = /^Try x = (\S+)$/.exec(line)
        if (tried) {
          expect(Number(tried[1]), card.id).toBe(x)
          continue
        }
        const [left, right] = line.replace(/(?<![A-Za-z])x(?![A-Za-z])/g, `(${x})`).split('=')
        expect(value(left), `${card.id}: ${line}`).toBe(value(right))
      }
    }
  })

  it('have rules short enough to fit on the card', () => {
    for (const card of MOVES) {
      expect(card.working.length, card.id).toBeLessThanOrEqual(3)
      // Three lines of working leave room for two lines of rule; two lines leave room for three.
      expect(card.rule.length, card.id).toBeLessThanOrEqual(card.working.length === 3 ? 58 : 70)
    }
  })
})
