import { fmtNum, MINUS, xTerm } from './format'
import { pick, shuffle, type Rng } from './rng'
import { stateBefore } from './solve'
import type { Equation, Problem, Step } from './types'

export type QuestionKind = 'type' | 'choice' | 'next-step'

export interface StepOption {
  label: string
  correct: boolean
  /** Shown after answering: why this option is right, or what goes wrong. */
  why: string
}

export interface Question {
  kind: QuestionKind
  problem: Problem
  /** The equation on screen. For next-step questions this can be a line partway through. */
  shown: Equation
  hints: string[]
  /** For 'choice': four values of x, one of them right. */
  numbers?: number[]
  /** For 'next-step': four moves, one of them right. */
  moves?: StepOption[]
}

const ONE_SIDE = 'That changes one side but not the other, so the two sides stop being equal.'
const ZERO: StepOption = {
  label: 'Multiply both sides by 0',
  correct: false,
  why: 'That wipes out everything. You are left with 0 = 0 and x has vanished.',
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Wrong answers a student could really arrive at, most tempting first. */
export function wrongAnswers(problem: Problem): number[] {
  const { equation, steps, solution } = problem
  const slips: number[] = []

  steps.forEach((step, i) => {
    const before = stateBefore(equation, steps, i)
    if (before.right.kind !== 'lin' || before.right.a !== 0) return
    const c = before.right.b
    if (step.op === 'div') {
      slips.push(c) // forgot to divide
      slips.push(c - step.value) // subtracted instead of dividing
    }
    if (step.op === 'mul' && step.value !== -1) {
      slips.push(c) // forgot to multiply
      if (Number.isInteger(c / step.value)) slips.push(c / step.value) // divided instead
    }
    if ((step.op === 'sub' || step.op === 'add') && before.left.kind === 'lin' && before.left.a !== 0) {
      // went the wrong way with the plain number
      const wrong = (c + before.left.b) / before.left.a
      if (Number.isInteger(wrong)) slips.push(wrong)
    }
  })

  const fillers = [
    -solution,
    solution + 1,
    solution - 1,
    solution + 2,
    solution - 2,
    solution * 2,
    solution + 3,
    solution + 5,
  ]

  const out: number[] = []
  for (const n of [...slips, ...fillers]) {
    if (!Number.isInteger(n) || n === solution || out.includes(n)) continue
    out.push(n)
    if (out.length === 3) break
  }
  return out
}

/** The three wrong moves offered beside the right one for a given step. */
function wrongMoves(before: Equation, step: Step): StepOption[] {
  const v = step.value
  const bad = (label: string, why: string): StepOption => ({ label, correct: false, why })

  switch (step.op) {
    case 'sub':
    case 'add': {
      const sub = step.op === 'sub'
      const opposite = sub
        ? bad(`Add ${v} to both sides`, `That makes it + ${2 * v} instead of getting rid of the + ${v}.`)
        : bad(
            `Subtract ${v} from both sides`,
            `That makes it ${MINUS} ${2 * v} instead of getting rid of the ${MINUS} ${v}.`,
          )
      const lopsided = bad(
        sub ? `Subtract ${v} from the left side only` : `Add ${v} to the left side only`,
        ONE_SIDE,
      )
      let third: StepOption
      if (before.left.kind === 'frac') {
        const d = before.left.den
        third = bad(
          `Subtract ${d} from both sides`,
          `The ${d} is dividing x, not added to it. Subtracting ${d} will not remove it.`,
        )
      } else if (before.left.kind === 'lin' && Math.abs(before.left.a) !== 1) {
        const a = Math.abs(before.left.a)
        third = bad(
          `Subtract ${a} from both sides`,
          `The ${fmtNum(before.left.a)} is multiplying x, not added to it. Subtracting ${a} will not remove it.`,
        )
      } else {
        third = bad(
          `Multiply both sides by ${v + 1}`,
          'That makes both sides bigger, and x is still not on its own.',
        )
      }
      return [opposite, lopsided, third]
    }

    case 'div': {
      const a = fmtNum(v)
      return [
        bad(`Multiply both sides by ${a}`, `That gives ${xTerm(v * v)}. You want just x.`),
        v > 0
          ? bad(
              `Subtract ${v} from both sides`,
              `${xTerm(v)} means ${v} × x. Subtracting ${v} does not undo multiplying.`,
            )
          : bad(
              `Add ${Math.abs(v)} to both sides`,
              `${xTerm(v)} means ${a} × x. Adding ${Math.abs(v)} does not undo multiplying.`,
            ),
        bad(`Divide the left side only by ${a}`, ONE_SIDE),
      ]
    }

    case 'mul': {
      if (v === -1) {
        return [
          bad('Add 1 to both sides', `${MINUS}x means ${MINUS}1 × x. Adding 1 does not undo multiplying.`),
          bad(`Multiply the left side only by ${MINUS}1`, ONE_SIDE),
          bad('Subtract x from both sides', `That leaves ${MINUS}2x on the left: more x terms, not fewer.`),
        ]
      }
      return [
        bad(
          `Divide both sides by ${v}`,
          `The left side is already divided by ${v}. Dividing again makes the fraction smaller, it does not remove it.`,
        ),
        bad(
          `Subtract ${v} from both sides`,
          `The ${v} is dividing, not added. Subtracting ${v} will not remove it.`,
        ),
        bad(`Multiply the left side only by ${v}`, ONE_SIDE),
      ]
    }

    case 'subx':
    case 'addx': {
      const sub = step.op === 'subx'
      const term = xTerm(v)
      return [
        bad(
          sub ? `Add ${term} to both sides` : `Subtract ${term} from both sides`,
          'That puts even more x terms on both sides.',
        ),
        bad(
          sub ? `Subtract ${term} from the right side only` : `Add ${term} to the right side only`,
          ONE_SIDE,
        ),
        bad(
          `Subtract ${v} from both sides`,
          `${capitalise(term)} is an x term. Taking away the plain number ${v} leaves the x terms where they are.`,
        ),
      ]
    }

    default:
      return []
  }
}

const NUDGE: Partial<Record<Step['op'], string>> = {
  sub: 'Look at the plain number sitting next to the x term.',
  add: 'Look at the plain number sitting next to the x term.',
  div: 'Look at the number multiplying x.',
  mul: 'Look at what x is being divided by.',
  subx: 'Look at the x terms. Which side has fewer?',
  addx: 'Look at the x terms on each side.',
}

/** True when a move would also be a sensible step, so it cannot be a wrong option. */
function alsoHelps(before: Equation, option: StepOption): boolean {
  const match = /^(Subtract|Add) (\d+) (from|to) both sides$/.exec(option.label)
  if (!match) return false
  const n = Number(match[2]) * (match[1] === 'Subtract' ? 1 : -1)
  const plain = (side: Equation['left']): number | null =>
    side.kind === 'lin' ? side.b : side.kind === 'frac' ? side.plus : null
  return plain(before.left) === n || plain(before.right) === n
}

/** A "what's a good next step?" question, or null if this problem has no clear-cut one. */
export function nextStepQuestion(problem: Problem, rng: Rng): Question | null {
  const { equation, steps } = problem
  const usable: number[] = []
  steps.forEach((step, i) => {
    const before = stateBefore(equation, steps, i)
    if (before.left.kind === 'bracket' || before.right.kind === 'bracket') return
    if (step.op === 'swap' || step.op === 'expand') return
    usable.push(i)
  })
  if (usable.length === 0) return null

  const i = pick(rng, usable)
  const step = steps[i]
  const before = stateBefore(equation, steps, i)
  const right: StepOption = { label: step.label, correct: true, why: `${capitalise(step.why)}.` }

  const wrong: StepOption[] = []
  for (const option of wrongMoves(before, step)) {
    const clash =
      option.label === right.label || wrong.some((w) => w.label === option.label) || alsoHelps(before, option)
    wrong.push(clash ? ZERO : option)
  }
  // The stand-in can only be used once.
  if (wrong.filter((w) => w === ZERO).length > 1) return null
  if (wrong.length !== 3) return null

  return {
    kind: 'next-step',
    problem,
    shown: before,
    hints: [
      'Whatever you choose has to happen to both sides.',
      NUDGE[step.op] ?? 'Which move gets x closer to being on its own?',
    ],
    moves: shuffle(rng, [right, ...wrong]),
  }
}

export function makeQuestion(problem: Problem, kind: QuestionKind, rng: Rng = Math.random): Question {
  if (kind === 'next-step') {
    const question = nextStepQuestion(problem, rng)
    if (question) return question
    kind = 'choice'
  }
  if (kind === 'choice') {
    return {
      kind,
      problem,
      shown: problem.equation,
      hints: problem.hints,
      numbers: shuffle(rng, [problem.solution, ...wrongAnswers(problem)]),
    }
  }
  return { kind: 'type', problem, shown: problem.equation, hints: problem.hints }
}
