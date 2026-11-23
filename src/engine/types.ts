/** A straight-line expression in x: a·x + b. */
export interface Lin {
  a: number
  b: number
}

/**
 * One side of an equation. Three shapes cover everything grade 7–8 meets:
 *   lin      a·x + b
 *   bracket  k(inner) + plus
 *   frac     (num) / den + plus
 */
export type Side =
  | ({ kind: 'lin' } & Lin)
  | { kind: 'bracket'; k: number; inner: Lin; plus: number }
  | { kind: 'frac'; num: Lin; den: number; plus: number }

export interface Equation {
  left: Side
  right: Side
}

export type OpType = 'add' | 'sub' | 'mul' | 'div' | 'addx' | 'subx' | 'expand' | 'swap'

/** One line of a worked solution: what was done, why, and what it leaves. */
export interface Step {
  op: OpType
  /** The number used, e.g. 3 for "subtract 3" or "subtract 3x". */
  value: number
  /** Full instruction: "Subtract 3 from both sides". */
  label: string
  /** Margin note: "− 3". */
  short: string
  /** Reason, written to follow the label: "to undo the + 3". */
  why: string
  result: Equation
}

export type SkillId = 'one-step' | 'two-step' | 'both-sides' | 'brackets' | 'fractions-negatives'

export interface Problem {
  id: string
  skill: SkillId
  equation: Equation
  solution: number
  steps: Step[]
  /** Three hints, each giving away a little more. */
  hints: [string, string, string]
}
