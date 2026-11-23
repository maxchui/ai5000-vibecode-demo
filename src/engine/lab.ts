import { int, type Rng } from './rng'
import { lin } from './solve'
import type { Equation } from './types'

/** What sits on one pan: mystery boxes (each hiding x) and loose 1-weights. */
export interface Pan {
  boxes: number
  units: number
}

export interface LabState {
  left: Pan
  right: Pan
  /** The number hidden in every box. The scale knows it; the player does not. */
  x: number
}

export type Where = 'both' | 'left' | 'right'

export type LabMove =
  { type: 'take'; what: 'units' | 'boxes'; n: number; where: Where } | { type: 'share'; n: number }

export interface LabOption {
  id: string
  move: LabMove
  label: string
  /** good: keeps the balance. tips: breaks it. blocked: cannot be done yet. */
  outcome: 'good' | 'tips' | 'blocked'
  /** What the coach says once the move has played out. */
  say: string
}

export const LAB_LIMITS = { boxes: 4, units: 15 }

const weightOf = (pan: Pan, x: number) => pan.boxes * x + pan.units

/** +1 when the left pan is heavier, −1 when the right is, 0 when level. */
export const tilt = (s: LabState): number => Math.sign(weightOf(s.left, s.x) - weightOf(s.right, s.x))

export const isBalanced = (s: LabState): boolean => tilt(s) === 0

/** Solved when one box sits alone opposite nothing but loose weights. */
export const isSolved = (s: LabState): boolean =>
  isBalanced(s) && s.left.boxes === 1 && s.left.units === 0 && s.right.boxes === 0

export const labEquation = (s: LabState): Equation => ({
  left: lin(s.left.boxes, s.left.units),
  right: lin(s.right.boxes, s.right.units),
})

const things = (n: number, what: 'units' | 'boxes') =>
  what === 'units' ? `${n} ${n === 1 ? 'weight' : 'weights'}` : `${n} ${n === 1 ? 'box' : 'boxes'}`

const takeFrom = (pan: Pan, what: 'units' | 'boxes', n: number): Pan =>
  what === 'units' ? { ...pan, units: pan.units - n } : { ...pan, boxes: pan.boxes - n }

export function canApply(s: LabState, move: LabMove): boolean {
  if (move.type === 'share') {
    return (
      move.n >= 2 &&
      s.left.boxes === move.n &&
      s.left.units === 0 &&
      s.right.boxes === 0 &&
      s.right.units % move.n === 0
    )
  }
  const has = (pan: Pan) => (move.what === 'units' ? pan.units : pan.boxes) >= move.n
  if (move.where === 'left') return has(s.left)
  if (move.where === 'right') return has(s.right)
  return has(s.left) && has(s.right)
}

export function applyMove(s: LabState, move: LabMove): LabState {
  if (!canApply(s, move)) throw new Error('That move is not possible here')
  if (move.type === 'share') {
    return { ...s, left: { boxes: 1, units: 0 }, right: { boxes: 0, units: s.right.units / move.n } }
  }
  return {
    ...s,
    left: move.where === 'right' ? s.left : takeFrom(s.left, move.what, move.n),
    right: move.where === 'left' ? s.right : takeFrom(s.right, move.what, move.n),
  }
}

/** The margin note for a balanced move: "− 3", "− 2x", "÷ 2". */
export function moveNote(move: LabMove): string {
  if (move.type === 'share') return `÷ ${move.n}`
  if (move.what === 'units') return `− ${move.n}`
  return `− ${move.n === 1 ? '' : move.n}x`
}

/** The choices on offer while the scale is level and unsolved. */
export function optionsFor(s: LabState): LabOption[] {
  if (!isBalanced(s) || isSolved(s)) return []
  const options: LabOption[] = []
  const sharedBoxes = Math.min(s.left.boxes, s.right.boxes)
  const sharedUnits = Math.min(s.left.units, s.right.units)

  if (sharedBoxes > 0) {
    options.push({
      id: 'boxes-both',
      move: { type: 'take', what: 'boxes', n: sharedBoxes, where: 'both' },
      label: `Take ${things(sharedBoxes, 'boxes')} off both sides`,
      outcome: 'good',
      say: `Both sides lost ${things(sharedBoxes, 'boxes')}, so the scale stays level.`,
    })
  }

  if (sharedUnits > 0) {
    options.push({
      id: 'units-both',
      move: { type: 'take', what: 'units', n: sharedUnits, where: 'both' },
      label: `Take ${things(sharedUnits, 'units')} off both sides`,
      outcome: 'good',
      say: `Both sides lost ${things(sharedUnits, 'units')}, so the scale stays level.`,
    })
  }

  // One tempting way to break the balance.
  if (sharedUnits > 0) {
    options.push({
      id: 'units-left',
      move: { type: 'take', what: 'units', n: sharedUnits, where: 'left' },
      label: `Take ${things(sharedUnits, 'units')} off the left side only`,
      outcome: 'tips',
      say: 'The left side is lighter now, so the scale tips. Whatever you do to one side, you have to do to the other.',
    })
  } else if (sharedBoxes > 0) {
    options.push({
      id: 'boxes-right',
      move: { type: 'take', what: 'boxes', n: sharedBoxes, where: 'right' },
      label: `Take ${things(sharedBoxes, 'boxes')} off the right side only`,
      outcome: 'tips',
      say: 'The right side is lighter now, so the scale tips. Whatever you do to one side, you have to do to the other.',
    })
  } else if (s.left.boxes >= 2 && s.right.units >= s.left.boxes) {
    const n = s.left.boxes
    options.push({
      id: 'units-right',
      move: { type: 'take', what: 'units', n, where: 'right' },
      label: `Take ${things(n, 'units')} off the right side only`,
      outcome: 'tips',
      say: `Now the left side is heavier. ${n}x means ${n} boxes, not "plus ${n}", so taking ${n} away does not undo it. Try sharing instead.`,
    })
  }

  if (s.left.boxes >= 2) {
    const n = s.left.boxes
    const move: LabMove = { type: 'share', n }
    const label = `Share both sides into ${n} equal groups`
    if (canApply(s, move)) {
      options.push({
        id: 'share',
        move,
        label,
        outcome: 'good',
        say: `${n} boxes balance ${s.right.units} weights, so 1 box balances ${s.right.units / n}.`,
      })
    } else {
      options.push({
        id: 'share',
        move,
        label,
        outcome: 'blocked',
        say:
          s.right.boxes > 0
            ? 'There are boxes on both sides, so sharing will not work yet. Take the same number of boxes off each side first.'
            : 'The loose weights on the left are in the way. Clear them off both sides first, then share.',
      })
    }
  }

  return options
}

/** After a one-sided move, the matching move on the other side (if there is room for it). */
export function repairFor(s: LabState, last: LabMove): LabMove | null {
  if (last.type !== 'take' || last.where === 'both') return null
  const repair: LabMove = { ...last, where: last.where === 'left' ? 'right' : 'left' }
  return canApply(s, repair) ? repair : null
}

export interface LabPreset extends LabState {
  id: string
  title: string
}

const make = (
  id: string,
  title: string,
  a: number,
  b: number,
  c: number,
  d: number,
  x: number,
): LabPreset => ({ id, title, left: { boxes: a, units: b }, right: { boxes: c, units: d }, x })

/** Six set challenges, easiest first. */
export const LAB_PRESETS: LabPreset[] = [
  make('warm-up', 'One step', 1, 3, 0, 8, 5),
  make('sharing', 'Sharing', 3, 0, 0, 12, 4),
  make('two-steps', 'Two steps', 2, 5, 0, 11, 3),
  make('three-boxes', 'Three boxes', 3, 2, 0, 14, 4),
  make('both-sides', 'Boxes on both sides', 3, 1, 1, 7, 3),
  make('the-lot', 'The lot', 4, 2, 2, 12, 5),
]

/** A fresh equation that fits on the pans and needs at least one move. */
export function randomLab(rng: Rng = Math.random): LabState {
  for (let tries = 0; tries < 500; tries++) {
    const a = int(rng, 1, LAB_LIMITS.boxes)
    const c = int(rng, 0, Math.min(2, a - 1))
    const groups = a - c
    const x = int(rng, 1, 6)
    const b = int(rng, 0, 5)
    const d = groups * x + b
    if (groups * x > 12 || d > LAB_LIMITS.units) continue
    const state: LabState = { left: { boxes: a, units: b }, right: { boxes: c, units: d }, x }
    if (isSolved(state)) continue
    return state
  }
  return { ...LAB_PRESETS[2] }
}
