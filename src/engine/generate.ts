import { fmtEq, fmtNum, MINUS, paren, signed } from './format'
import { int, intNonZero, pick, type Rng } from './rng'
import { holdsAt, lin, solutionOf, solveSteps } from './solve'
import type { Equation, Problem, Side, SkillId, Step } from './types'

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

export interface SkillInfo {
  id: SkillId
  name: string
  blurb: string
  example: Equation
  /** XP for a correct answer with no hints. */
  baseXp: number
}

export const SKILLS: SkillInfo[] = [
  {
    id: 'one-step',
    name: 'One-step equations',
    blurb: 'Undo one thing to get x on its own.',
    example: { left: lin(1, 5), right: lin(0, 12) },
    baseXp: 10,
  },
  {
    id: 'two-step',
    name: 'Two-step equations',
    blurb: 'Undo two things, in the right order.',
    example: { left: lin(2, 3), right: lin(0, 11) },
    baseXp: 15,
  },
  {
    id: 'both-sides',
    name: 'x on both sides',
    blurb: 'Collect the x terms first, then solve.',
    example: { left: lin(5, -2), right: lin(3, 8) },
    baseXp: 20,
  },
  {
    id: 'brackets',
    name: 'Brackets',
    blurb: 'Expand the brackets, then solve.',
    example: { left: bracket(3, 2), right: lin(0, 21) },
    baseXp: 25,
  },
  {
    id: 'fractions-negatives',
    name: 'Fractions and negatives',
    blurb: 'The same rules with trickier numbers.',
    example: { left: frac(1, 0, 3, 7), right: lin(0, 2) },
    baseXp: 30,
  },
]

export const SKILL_ORDER: SkillId[] = SKILLS.map((s) => s.id)
export const skillInfo = (id: SkillId): SkillInfo => SKILLS.find((s) => s.id === id)!

interface Draft {
  equation: Equation
  /** The gentlest hint: a nudge towards the method, not the answer. */
  hint: string
}

/** A recipe for one family of question. Returning null means "roll again". */
type Template = (r: Rng) => Draft | null

const oneStepAdd: Template = (r) => {
  const b = int(r, 2, 12)
  const x = int(r, 1, 15)
  return {
    equation: { left: lin(1, b), right: lin(0, x + b) },
    hint: `x has ${b} added to it. What undoes adding ${b}?`,
  }
}

const oneStepSub: Template = (r) => {
  const b = int(r, 2, 12)
  const c = int(r, 1, 15)
  return {
    equation: { left: lin(1, -b), right: lin(0, c) },
    hint: `x has ${b} taken away from it. What undoes subtracting ${b}?`,
  }
}

const oneStepMul: Template = (r) => {
  const a = int(r, 2, 9)
  const x = int(r, 2, 12)
  return {
    equation: { left: lin(a, 0), right: lin(0, a * x) },
    hint: `${a}x means ${a} × x. What undoes multiplying by ${a}?`,
  }
}

const oneStepDiv: Template = (r) => {
  const d = int(r, 2, 6)
  const q = int(r, 2, 9)
  return {
    equation: { left: frac(1, 0, d), right: lin(0, q) },
    hint: `x is divided by ${d}. What undoes dividing by ${d}?`,
  }
}

const oneStepFlipped: Template = (r) => {
  const b = int(r, 2, 12)
  const x = int(r, 1, 15)
  return {
    equation: { left: lin(0, x + b), right: lin(1, b) },
    hint: `It does not matter which side x is on. x has ${b} added to it. What undoes adding ${b}?`,
  }
}

const twoStepPlus: Template = (r) => {
  const a = int(r, 2, 6)
  const x = int(r, 1, 10)
  const b = int(r, 1, 12)
  return {
    equation: { left: lin(a, b), right: lin(0, a * x + b) },
    hint: `Two things happen to x: it is multiplied by ${a}, then ${b} is added. Undo them in reverse order.`,
  }
}

const twoStepMinus: Template = (r) => {
  const a = int(r, 2, 6)
  const x = int(r, 2, 10)
  const b = int(r, 1, Math.min(12, a * x - 1))
  return {
    equation: { left: lin(a, -b), right: lin(0, a * x - b) },
    hint: `Two things happen to x: it is multiplied by ${a}, then ${b} is taken away. Undo them in reverse order.`,
  }
}

const twoStepFracPlus: Template = (r) => {
  const d = int(r, 2, 5)
  const q = int(r, 1, 8)
  const b = int(r, 1, 9)
  return {
    equation: { left: frac(1, 0, d, b), right: lin(0, q + b) },
    hint: `x is divided by ${d}, then ${b} is added. Undo the adding first.`,
  }
}

const twoStepFracMinus: Template = (r) => {
  const d = int(r, 2, 5)
  const q = int(r, 2, 9)
  const b = int(r, 1, q - 1)
  return {
    equation: { left: frac(1, 0, d, -b), right: lin(0, q - b) },
    hint: `x is divided by ${d}, then ${b} is taken away. Undo the subtracting first.`,
  }
}

const bothSides: Template = (r) => {
  const c = int(r, 1, 4)
  const a = c + int(r, 1, 4)
  const x = int(r, 1, 9)
  const b = intNonZero(r, -9, 9)
  const d = (a - c) * x + b
  if (d === 0) return null
  return {
    equation: { left: lin(a, b), right: lin(c, d) },
    hint: 'There are x terms on both sides. Collect them on one side first. Which side has fewer?',
  }
}

const bracketSimple: Template = (r) => {
  const k = int(r, 2, 6)
  const m = intNonZero(r, -6, 6)
  const lowest = Math.max(1, 1 - m)
  const x = int(r, lowest, lowest + 8)
  return {
    equation: { left: bracket(k, m), right: lin(0, k * (x + m)) },
    hint: `Deal with the brackets first: multiply ${k} by everything inside them.`,
  }
}

const bracketPlus: Template = (r) => {
  const k = int(r, 2, 5)
  const m = intNonZero(r, -6, 6)
  const p = int(r, 1, 9)
  const lowest = Math.max(1, 1 - m)
  const x = int(r, lowest, lowest + 8)
  if (k * m + p === 0) return null
  return {
    equation: { left: bracket(k, m, p), right: lin(0, k * (x + m) + p) },
    hint: `Deal with the brackets first: multiply ${k} by everything inside them. Then tidy up the plain numbers.`,
  }
}

const bracketBothSides: Template = (r) => {
  const k = int(r, 3, 6)
  const c = int(r, 1, k - 1)
  const m = intNonZero(r, -5, 5)
  const x = int(r, 1, 9)
  const d = k * m + (k - c) * x
  if (d === 0) return null
  return {
    equation: { left: bracket(k, m), right: lin(c, d) },
    hint: `Expand the brackets first: multiply ${k} by everything inside. Then collect the x terms.`,
  }
}

const negativeAnswer: Template = (r) => {
  const a = int(r, 2, 6)
  const x = int(r, -9, -1)
  const b = int(r, 1, 12)
  return {
    equation: { left: lin(a, b), right: lin(0, a * x + b) },
    hint: 'Solve it like any two-step equation. The answer can be a negative number.',
  }
}

const negativeCoefficient: Template = (r) => {
  const a = int(r, 2, 6)
  const x = intNonZero(r, -6, 8)
  const b = int(r, 1, 15)
  return {
    equation: { left: lin(-a, b), right: lin(0, -a * x + b) },
    hint: `Undo the + ${b} first. After that you will divide by a negative number, ${fmtNum(-a)}.`,
  }
}

const fractionWholeTop: Template = (r) => {
  const d = int(r, 2, 5)
  const m = intNonZero(r, -8, 8)
  const q = intNonZero(r, -4, 8)
  return {
    equation: { left: frac(1, m, d), right: lin(0, q) },
    hint: `The whole top, x ${signed(m)}, is divided by ${d}. Undo the dividing first.`,
  }
}

const fractionNegative: Template = (r) => {
  const d = int(r, 2, 5)
  const q = int(r, -8, -1)
  const b = int(r, 1, 9)
  return {
    equation: { left: frac(1, 0, d, b), right: lin(0, q + b) },
    hint: 'Get the fraction on its own first. Expect a negative number on the right.',
  }
}

const fractionTwoStepTop: Template = (r) => {
  const a = int(r, 2, 4)
  const d = int(r, 2, 5)
  const x = intNonZero(r, -5, 9)
  const q = intNonZero(r, -3, 8)
  const b = q * d - a * x
  if (b === 0 || Math.abs(b) > 15) return null
  return {
    equation: { left: frac(a, b, d), right: lin(0, q) },
    hint: `Multiply both sides by ${d} first to clear the fraction. What is left is a two-step equation.`,
  }
}

/** Listing a template twice makes it twice as likely. */
const TEMPLATES: Record<SkillId, Template[]> = {
  'one-step': [
    oneStepAdd,
    oneStepAdd,
    oneStepSub,
    oneStepSub,
    oneStepMul,
    oneStepMul,
    oneStepDiv,
    oneStepDiv,
    oneStepFlipped,
  ],
  'two-step': [twoStepPlus, twoStepPlus, twoStepMinus, twoStepMinus, twoStepFracPlus, twoStepFracMinus],
  'both-sides': [bothSides],
  brackets: [bracketSimple, bracketSimple, bracketPlus, bracketBothSides],
  'fractions-negatives': [
    negativeAnswer,
    negativeCoefficient,
    fractionWholeTop,
    fractionNegative,
    fractionTwoStepTop,
  ],
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

const sideIsWhole = (s: Side): boolean => {
  switch (s.kind) {
    case 'lin':
      return Number.isInteger(s.a) && Number.isInteger(s.b)
    case 'bracket':
      return [s.k, s.inner.a, s.inner.b, s.plus].every(Number.isInteger)
    case 'frac':
      return [s.num.a, s.num.b, s.den, s.plus].every(Number.isInteger)
  }
}

/** The sum left to do when one step finishes the job: "12 − 5". */
function lastSum(before: Equation, step: Step): string | null {
  if (before.right.kind !== 'lin' || before.right.a !== 0) return null
  const c = fmtNum(before.right.b)
  switch (step.op) {
    case 'sub':
      return `${c} ${MINUS} ${step.value}`
    case 'add':
      return `${c} + ${step.value}`
    case 'div':
      return `${c} ÷ ${paren(step.value)}`
    case 'mul':
      return `${c} × ${paren(step.value)}`
    default:
      return null
  }
}

function buildHints(first: string, equation: Equation, steps: Step[]): [string, string, string] {
  const second = `${steps[0].label}.`
  let third: string
  if (steps.length === 1) {
    const sum = lastSum(equation, steps[0])
    third = sum ? `So x = ${sum}. Work that out.` : `${steps[0].label}, ${steps[0].why}.`
  } else {
    third = `That gives ${fmtEq(steps[0].result)}. Next: ${lowerFirst(steps[1].label)}.`
  }
  return [first, second, third]
}

/** Turn a draft into a full problem, or reject it if anything is off. */
function build(skill: SkillId, draft: Draft): Problem | null {
  let steps: Step[]
  try {
    steps = solveSteps(draft.equation)
  } catch {
    return null
  }
  if (steps.length === 0) return null

  const last = steps[steps.length - 1].result
  if (last.left.kind !== 'lin' || last.right.kind !== 'lin') return null
  if (last.left.a !== 1 || last.left.b !== 0 || last.right.a !== 0) return null

  const solution = last.right.b
  if (!Number.isInteger(solution) || solution === 0) return null

  // Two independent routes to the answer must agree, and every line of the
  // working must be true and stay in whole numbers.
  if (solutionOf(draft.equation) !== solution) return null
  if (!holdsAt(draft.equation, solution)) return null
  for (const step of steps) {
    if (!holdsAt(step.result, solution)) return null
    if (!sideIsWhole(step.result.left) || !sideIsWhole(step.result.right)) return null
  }

  return {
    id: `${skill}:${fmtEq(draft.equation)}`,
    skill,
    equation: draft.equation,
    solution,
    steps,
    hints: buildHints(draft.hint, draft.equation, steps),
  }
}

/** A fresh question for a skill. Pass `avoid` to rule out an immediate repeat. */
export function generateProblem(
  skill: SkillId,
  rng: Rng = Math.random,
  avoid: readonly string[] = [],
): Problem {
  for (let tries = 0; tries < 500; tries++) {
    const draft = pick(rng, TEMPLATES[skill])(rng)
    if (!draft) continue
    const problem = build(skill, draft)
    if (!problem || avoid.includes(problem.id)) continue
    return problem
  }
  throw new Error(`Could not generate a ${skill} problem`)
}
