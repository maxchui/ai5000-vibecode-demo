import { describe, expect, it } from 'vitest'
import { fmtEq, fmtSide } from './format'
import { generateProblem, SKILL_ORDER, SKILLS } from './generate'
import {
  applyMove,
  canApply,
  isBalanced,
  isSolved,
  LAB_LIMITS,
  LAB_PRESETS,
  labEquation,
  optionsFor,
  randomLab,
  repairFor,
  tilt,
  type LabState,
} from './lab'
import { makeQuestion, wrongAnswers } from './questions'
import { mulberry32 } from './rng'
import { evalSide, holdsAt, lin, solutionOf, solveSteps } from './solve'
import type { Equation, Side } from './types'

const frac = (a: number, b: number, den: number, plus = 0): Side => ({
  kind: 'frac',
  num: { a, b },
  den,
  plus,
})
const bracket = (k: number, m: number, plus = 0): Side => ({
  kind: 'bracket',
  k,
  inner: { a: 1, b: m },
  plus,
})
const eq = (left: Side, right: Side): Equation => ({ left, right })

const labels = (e: Equation) => solveSteps(e).map((s) => s.label)
const lines = (e: Equation) => solveSteps(e).map((s) => fmtEq(s.result))

describe('formatting', () => {
  it('writes expressions the way a textbook does', () => {
    expect(fmtSide(lin(1, 0))).toBe('x')
    expect(fmtSide(lin(-1, 0))).toBe('−x')
    expect(fmtSide(lin(2, 3))).toBe('2x + 3')
    expect(fmtSide(lin(5, -2))).toBe('5x − 2')
    expect(fmtSide(lin(-3, 4))).toBe('−3x + 4')
    expect(fmtSide(lin(0, -7))).toBe('−7')
    expect(fmtSide(bracket(3, 2))).toBe('3(x + 2)')
    expect(fmtSide(bracket(4, -1, 5))).toBe('4(x − 1) + 5')
    expect(fmtSide(frac(1, 0, 4, 2))).toBe('x/4 + 2')
    expect(fmtSide(frac(1, 3, 2))).toBe('(x + 3)/2')
    expect(fmtSide(frac(2, -4, 3))).toBe('(2x − 4)/3')
  })
})

describe('worked solutions', () => {
  it('solves a two-step equation in the usual order', () => {
    const e = eq(lin(2, 3), lin(0, 11))
    expect(labels(e)).toEqual(['Subtract 3 from both sides', 'Divide both sides by 2'])
    expect(lines(e)).toEqual(['2x = 8', 'x = 4'])
  })

  it('collects x terms first when x is on both sides', () => {
    const e = eq(lin(5, -2), lin(3, 8))
    expect(labels(e)).toEqual([
      'Subtract 3x from both sides',
      'Add 2 to both sides',
      'Divide both sides by 2',
    ])
    expect(lines(e)).toEqual(['2x − 2 = 8', '2x = 10', 'x = 5'])
  })

  it('expands brackets before anything else', () => {
    const e = eq(bracket(3, 2), lin(0, 21))
    expect(labels(e)).toEqual(['Expand the brackets', 'Subtract 6 from both sides', 'Divide both sides by 3'])
    expect(lines(e)).toEqual(['3x + 6 = 21', '3x = 15', 'x = 5'])
  })

  it('tidies the plain numbers when a bracket has something added after it', () => {
    const e = eq(bracket(4, -1, 5), lin(0, 13))
    expect(lines(e)).toEqual(['4x + 1 = 13', '4x = 12', 'x = 3'])
    expect(solveSteps(e)[0].why).toContain('4 × (−1) = −4')
    expect(solveSteps(e)[0].why).toContain('−4 + 5 = 1')
  })

  it('isolates a fraction, then multiplies up', () => {
    const e = eq(frac(1, 0, 4, 2), lin(0, 5))
    expect(labels(e)).toEqual(['Subtract 2 from both sides', 'Multiply both sides by 4'])
    expect(lines(e)).toEqual(['x/4 = 3', 'x = 12'])
  })

  it('clears a fraction whose whole top is divided', () => {
    const e = eq(frac(1, 3, 2), lin(0, 5))
    expect(lines(e)).toEqual(['x + 3 = 10', 'x = 7'])
  })

  it('divides by a negative coefficient', () => {
    const e = eq(lin(-3, 4), lin(0, 19))
    expect(labels(e)).toEqual(['Subtract 4 from both sides', 'Divide both sides by −3'])
    expect(lines(e)).toEqual(['−3x = 15', 'x = −5'])
  })

  it('swaps the sides when x starts on the right', () => {
    const e = eq(lin(0, 12), lin(1, 5))
    expect(labels(e)).toEqual(['Swap the two sides', 'Subtract 5 from both sides'])
    expect(lines(e)).toEqual(['x + 5 = 12', 'x = 7'])
  })

  it('refuses equations with no single answer', () => {
    expect(() => solveSteps(eq(lin(2, 1), lin(2, 5)))).toThrow()
    expect(() => solveSteps(eq(lin(2, 0), lin(0, 7)))).toThrow()
  })
})

describe('generated questions', () => {
  it('gives every skill an example that is a real equation of that skill', () => {
    for (const skill of SKILLS) {
      expect(Number.isInteger(solutionOf(skill.example))).toBe(true)
      expect(solveSteps(skill.example).length).toBeGreaterThan(0)
    }
  })

  for (const skill of SKILL_ORDER) {
    it(`${skill}: 4000 questions are all correct, whole-number and fully worked`, () => {
      const rng = mulberry32(20261123 + skill.length)
      const seen = new Set<string>()
      for (let n = 0; n < 4000; n++) {
        const p = generateProblem(skill, rng)
        seen.add(p.id)

        expect(Number.isInteger(p.solution)).toBe(true)
        expect(p.solution).not.toBe(0)
        expect(Math.abs(p.solution)).toBeLessThanOrEqual(60)
        // The answer really does make both sides equal.
        expect(evalSide(p.equation.left, p.solution)).toBeCloseTo(evalSide(p.equation.right, p.solution), 9)
        // An independent method agrees with the worked steps.
        expect(solutionOf(p.equation)).toBe(p.solution)

        expect(p.steps.length).toBeGreaterThanOrEqual(1)
        expect(p.steps.length).toBeLessThanOrEqual(5)
        for (const step of p.steps) {
          expect(holdsAt(step.result, p.solution)).toBe(true)
          expect(step.label.length).toBeGreaterThan(0)
          expect(step.why.length).toBeGreaterThan(0)
        }
        expect(fmtEq(p.steps[p.steps.length - 1].result)).toBe(
          `x = ${p.solution < 0 ? '−' : ''}${Math.abs(p.solution)}`,
        )

        expect(p.hints).toHaveLength(3)
        for (const hint of p.hints) expect(hint).not.toMatch(/undefined|NaN/)
        // No hint hands over the final answer. ("x = 11 − 10" is a sum to do, not the answer "x = 1".)
        const answer = fmtEq(p.steps[p.steps.length - 1].result)
        const givesAway = new RegExp(`${answer}(?!\\d)(?! [+−×÷])`)
        for (const hint of p.hints) expect(hint).not.toMatch(givesAway)
      }
      // Plenty of variety.
      expect(seen.size).toBeGreaterThan(skill === 'one-step' ? 150 : 300)
    })
  }

  it('does not repeat a question it was asked to avoid', () => {
    const rng = mulberry32(7)
    const first = generateProblem('one-step', rng)
    for (let n = 0; n < 500; n++) {
      expect(generateProblem('one-step', rng, [first.id]).id).not.toBe(first.id)
    }
  })
})

describe('question types', () => {
  it('multiple choice always offers four different values with exactly one right', () => {
    const rng = mulberry32(99)
    for (const skill of SKILL_ORDER) {
      for (let n = 0; n < 1500; n++) {
        const p = generateProblem(skill, rng)
        expect(wrongAnswers(p)).toHaveLength(3)
        const q = makeQuestion(p, 'choice', rng)
        expect(q.numbers).toHaveLength(4)
        expect(new Set(q.numbers).size).toBe(4)
        expect(q.numbers!.filter((v) => v === p.solution)).toHaveLength(1)
        // No wrong value sneaks in as a second solution.
        for (const v of q.numbers!) expect(holdsAt(p.equation, v)).toBe(v === p.solution)
      }
    }
  })

  it('next-step questions have four different moves, exactly one right, shown on a true line', () => {
    const rng = mulberry32(4242)
    let made = 0
    for (const skill of SKILL_ORDER) {
      for (let n = 0; n < 1500; n++) {
        const p = generateProblem(skill, rng)
        const q = makeQuestion(p, 'next-step', rng)
        if (q.kind !== 'next-step') continue
        made++
        expect(q.moves).toHaveLength(4)
        expect(new Set(q.moves!.map((m) => m.label)).size).toBe(4)
        expect(q.moves!.filter((m) => m.correct)).toHaveLength(1)
        expect(holdsAt(q.shown, p.solution)).toBe(true)
        for (const m of q.moves!) {
          expect(m.why).not.toMatch(/undefined|NaN/)
          expect(m.label).not.toMatch(/undefined|NaN/)
        }
        // The right move is the step the worked solution takes from this line.
        const right = q.moves!.find((m) => m.correct)!
        expect(p.steps.map((s) => s.label)).toContain(right.label)
        expect(q.hints.length).toBeGreaterThanOrEqual(1)
      }
    }
    // Nearly every problem can be asked this way.
    expect(made).toBeGreaterThan(7000)
  })

  it('never offers a wrong move that would actually clear a plain number', () => {
    const rng = mulberry32(31337)
    for (const skill of SKILL_ORDER) {
      for (let n = 0; n < 1500; n++) {
        const p = generateProblem(skill, rng)
        const q = makeQuestion(p, 'next-step', rng)
        if (q.kind !== 'next-step') continue
        for (const m of q.moves!.filter((o) => !o.correct)) {
          const hit = /^(Subtract|Add) (\d+) (from|to) both sides$/.exec(m.label)
          if (!hit) continue
          const change = Number(hit[2]) * (hit[1] === 'Subtract' ? 1 : -1)
          for (const side of [q.shown.left, q.shown.right]) {
            const plain = side.kind === 'lin' ? side.b : side.kind === 'frac' ? side.plus : null
            expect(plain).not.toBe(change)
          }
        }
      }
    }
  })
})

/** Play only the balance-keeping moves until the box is alone. */
function playThrough(start: LabState): { state: LabState; moves: number } {
  let state = start
  let moves = 0
  while (!isSolved(state)) {
    const good = optionsFor(state).find((o) => o.outcome === 'good')
    if (!good) throw new Error(`Stuck at ${fmtEq(labEquation(state))}`)
    state = applyMove(state, good.move)
    expect(isBalanced(state)).toBe(true)
    moves++
    if (moves > 6) throw new Error('Too many moves')
  }
  return { state, moves }
}

function checkOptions(state: LabState) {
  for (const option of optionsFor(state)) {
    if (option.outcome === 'blocked') {
      expect(canApply(state, option.move)).toBe(false)
      continue
    }
    const after = applyMove(state, option.move)
    if (option.outcome === 'good') {
      expect(isBalanced(after)).toBe(true)
    } else {
      expect(tilt(after)).not.toBe(0)
      // Either the same move on the other side restores the balance, or there is nothing to take.
      const repair = repairFor(after, option.move)
      if (repair) expect(isBalanced(applyMove(after, repair))).toBe(true)
    }
  }
}

describe('balance lab', () => {
  it('every set challenge starts level, fits on the pans and can be solved', () => {
    expect(LAB_PRESETS).toHaveLength(6)
    for (const preset of LAB_PRESETS) {
      expect(isBalanced(preset)).toBe(true)
      expect(isSolved(preset)).toBe(false)
      expect(Math.max(preset.left.boxes, preset.right.boxes)).toBeLessThanOrEqual(LAB_LIMITS.boxes)
      expect(Math.max(preset.left.units, preset.right.units)).toBeLessThanOrEqual(LAB_LIMITS.units)
      expect(solutionOf(labEquation(preset))).toBe(preset.x)
      const { state } = playThrough(preset)
      expect(state.right.units).toBe(preset.x)
    }
  })

  it('offers a way to tip the scale at every step of every challenge', () => {
    for (const preset of LAB_PRESETS) {
      let state: LabState = preset
      while (!isSolved(state)) {
        const options = optionsFor(state)
        checkOptions(state)
        expect(options.some((o) => o.outcome === 'good')).toBe(true)
        expect(options.some((o) => o.outcome === 'tips')).toBe(true)
        expect(new Set(options.map((o) => o.label)).size).toBe(options.length)
        state = applyMove(state, options.find((o) => o.outcome === 'good')!.move)
      }
      expect(optionsFor(state)).toEqual([])
    }
  })

  it('2000 random equations are level, fit on the pans and can be solved', () => {
    const rng = mulberry32(555)
    const seen = new Set<string>()
    for (let n = 0; n < 2000; n++) {
      const lab = randomLab(rng)
      seen.add(fmtEq(labEquation(lab)))
      expect(isBalanced(lab)).toBe(true)
      expect(lab.left.boxes).toBeLessThanOrEqual(LAB_LIMITS.boxes)
      expect(lab.right.units).toBeLessThanOrEqual(LAB_LIMITS.units)
      expect(lab.x).toBeGreaterThanOrEqual(1)
      checkOptions(lab)
      const { state, moves } = playThrough(lab)
      expect(moves).toBeGreaterThanOrEqual(1)
      expect(state.right.units).toBe(lab.x)
    }
    expect(seen.size).toBeGreaterThan(80)
  })
})
