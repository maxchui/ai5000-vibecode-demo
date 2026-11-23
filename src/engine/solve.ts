import { fmtNum, MINUS, paren, xTerm } from './format'
import type { Equation, Side, Step } from './types'

export const lin = (a: number, b: number): Side => ({ kind: 'lin', a, b })

export function evalSide(s: Side, x: number): number {
  switch (s.kind) {
    case 'lin':
      return s.a * x + s.b
    case 'bracket':
      return s.k * (s.inner.a * x + s.inner.b) + s.plus
    case 'frac':
      return (s.num.a * x + s.num.b) / s.den + s.plus
  }
}

/** True when both sides come out equal for this value of x. */
export function holdsAt(eq: Equation, x: number): boolean {
  return Math.abs(evalSide(eq.left, x) - evalSide(eq.right, x)) < 1e-9
}

/**
 * The answer, found without the step-by-step method: left − right is a
 * straight line in x, so two sample points pin down where it crosses zero.
 * Used to cross-check the worked steps.
 */
export function solutionOf(eq: Equation): number {
  const f = (x: number) => evalSide(eq.left, x) - evalSide(eq.right, x)
  const atZero = f(0)
  const slope = f(1) - atZero
  if (Math.abs(slope) < 1e-12) throw new Error('Equation has no single solution')
  const x = -atZero / slope
  const rounded = Math.round(x)
  return Math.abs(x - rounded) < 1e-9 ? rounded : x
}

/** The next move a teacher would make, or null when x is alone. */
function nextStep(eq: Equation): Step | null {
  const { left, right } = eq

  // 1. Brackets come off first.
  if (left.kind === 'bracket' || right.kind === 'bracket') {
    const expand = (s: Side): Side =>
      s.kind === 'bracket' ? lin(s.k * s.inner.a, s.k * s.inner.b + s.plus) : s
    const b = (left.kind === 'bracket' ? left : right) as Extract<Side, { kind: 'bracket' }>
    const parts: string[] = []
    if (b.inner.a !== 0) parts.push(`${b.k} × ${xTerm(b.inner.a)} = ${xTerm(b.k * b.inner.a)}`)
    if (b.inner.b !== 0) parts.push(`${b.k} × ${paren(b.inner.b)} = ${fmtNum(b.k * b.inner.b)}`)
    let why = `Multiply everything inside the brackets by ${b.k}: ${parts.join(' and ')}.`
    if (b.plus !== 0 && b.inner.b !== 0) {
      const product = b.k * b.inner.b
      why += ` Then ${fmtNum(product)} ${b.plus > 0 ? '+' : MINUS} ${Math.abs(b.plus)} = ${fmtNum(product + b.plus)}.`
    }
    return {
      op: 'expand',
      value: b.k,
      label: 'Expand the brackets',
      short: 'expand',
      why,
      result: { left: expand(left), right: expand(right) },
    }
  }

  // 2. Fractions: keep the fraction on the left, strip it down, then multiply up.
  if (left.kind !== 'frac' && right.kind === 'frac') return swap(eq)
  if (left.kind === 'frac') {
    if (right.kind !== 'lin') throw new Error('Unsupported equation shape')
    if (left.plus !== 0) {
      const v = Math.abs(left.plus)
      const sub = left.plus > 0
      return {
        op: sub ? 'sub' : 'add',
        value: v,
        label: sub ? `Subtract ${v} from both sides` : `Add ${v} to both sides`,
        short: sub ? `${MINUS} ${v}` : `+ ${v}`,
        why: sub ? `to undo the + ${v}` : `to undo the ${MINUS} ${v}`,
        result: { left: { ...left, plus: 0 }, right: lin(right.a, right.b - left.plus) },
      }
    }
    return {
      op: 'mul',
      value: left.den,
      label: `Multiply both sides by ${left.den}`,
      short: `× ${left.den}`,
      why: `to undo the ÷ ${left.den}`,
      result: {
        left: lin(left.num.a, left.num.b),
        right: lin(right.a * left.den, right.b * left.den),
      },
    }
  }

  // 3. Plain a·x + b on each side.
  if (right.kind !== 'lin') throw new Error('Unsupported equation shape')
  if (left.a === 0 && right.a === 0) throw new Error('Equation has no x in it')
  if (left.a === 0) return swap(eq)

  if (right.a !== 0) {
    if (left.a === right.a) throw new Error('Equation has no single solution')
    const v = Math.abs(right.a)
    const sub = right.a > 0
    const term = xTerm(v)
    return {
      op: sub ? 'subx' : 'addx',
      value: v,
      label: sub ? `Subtract ${term} from both sides` : `Add ${term} to both sides`,
      short: sub ? `${MINUS} ${term}` : `+ ${term}`,
      why: 'to collect the x terms on one side',
      result: { left: lin(left.a - right.a, left.b), right: lin(0, right.b) },
    }
  }

  if (left.b !== 0) {
    const v = Math.abs(left.b)
    const sub = left.b > 0
    return {
      op: sub ? 'sub' : 'add',
      value: v,
      label: sub ? `Subtract ${v} from both sides` : `Add ${v} to both sides`,
      short: sub ? `${MINUS} ${v}` : `+ ${v}`,
      why: sub ? `to undo the + ${v}` : `to undo the ${MINUS} ${v}`,
      result: { left: lin(left.a, 0), right: lin(0, right.b - left.b) },
    }
  }

  if (left.a === -1) {
    return {
      op: 'mul',
      value: -1,
      label: `Multiply both sides by ${MINUS}1`,
      short: `× (${MINUS}1)`,
      why: `to turn ${MINUS}x into x`,
      result: { left: lin(1, 0), right: lin(0, -right.b) },
    }
  }

  if (left.a !== 1) {
    const quotient = right.b / left.a
    if (!Number.isInteger(quotient)) throw new Error('Answer is not a whole number')
    return {
      op: 'div',
      value: left.a,
      label: `Divide both sides by ${fmtNum(left.a)}`,
      short: `÷ ${paren(left.a)}`,
      why: `because ${xTerm(left.a)} means ${fmtNum(left.a)} × x`,
      result: { left: lin(1, 0), right: lin(0, quotient) },
    }
  }

  return null
}

function swap(eq: Equation): Step {
  return {
    op: 'swap',
    value: 0,
    label: 'Swap the two sides',
    short: 'swap',
    why: 'so that x is on the left. The equation means the same either way round',
    result: { left: eq.right, right: eq.left },
  }
}

/** The full worked solution, ending with x on its own. Throws if it cannot. */
export function solveSteps(eq: Equation): Step[] {
  const steps: Step[] = []
  let current = eq
  for (let guard = 0; guard < 12; guard++) {
    const step = nextStep(current)
    if (!step) return steps
    steps.push(step)
    current = step.result
  }
  throw new Error('Solver did not finish')
}

/** The equation as it stands before step i. */
export function stateBefore(equation: Equation, steps: Step[], i: number): Equation {
  return i === 0 ? equation : steps[i - 1].result
}
