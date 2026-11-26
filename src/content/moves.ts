import { lin } from '../engine/solve'
import type { Equation, Side, SkillId } from '../engine/types'

/** How hard a card is to find. Holo cards are the shiny ones. */
export type Rarity = 'common' | 'rare' | 'holo'

export type MoveId =
  | 'take-it-away'
  | 'add-it-back'
  | 'share-it-out'
  | 'times-it-up'
  | 'check-it'
  | 'undo-in-order'
  | 'collect-the-x'
  | 'open-the-brackets'
  | 'clear-the-fraction'
  | 'flip-the-sign'
  | 'keep-it-level'
  | 'found-x'

export type MoveTone = 'cross' | 'tick' | 'cobalt' | 'hi' | 'box'

/**
 * A collectable card. Each one is a move for solving an equation, so the
 * collection doubles as a crib sheet.
 */
export interface MoveCard {
  id: MoveId
  name: string
  rarity: Rarity
  tone: MoveTone
  /** The skill that leans on this move most. Null when every equation uses it. */
  skill: SkillId | null
  /** The move, as an instruction. Two lines at most on a card with three lines of working. */
  rule: string
  /**
   * The move in action. Equations are drawn; text is written as it is. Every
   * equation on one card has the same answer, which the tests check.
   */
  working: (Equation | string)[]
}

export const RARITY: Record<Rarity, { label: string; stars: number; rank: number }> = {
  common: { label: 'Common', stars: 1, rank: 0 },
  rare: { label: 'Rare', stars: 2, rank: 1 },
  holo: { label: 'Holo', stars: 3, rank: 2 },
}

const eq = (left: Side, right: Side): Equation => ({ left, right })
const num = (n: number): Side => lin(0, n)
const fraction = (a: number, b: number, den: number): Side => ({ kind: 'frac', num: { a, b }, den, plus: 0 })

/** In album order: common first, holo last. */
export const MOVES: MoveCard[] = [
  {
    id: 'take-it-away',
    name: 'Take it away',
    rarity: 'common',
    tone: 'cross',
    skill: 'one-step',
    rule: 'Subtract the same number from both sides to undo a plus.',
    working: [eq(lin(1, 5), num(12)), eq(lin(1, 0), num(7))],
  },
  {
    id: 'add-it-back',
    name: 'Add it back',
    rarity: 'common',
    tone: 'tick',
    skill: 'one-step',
    rule: 'Add the same number to both sides to undo a minus.',
    working: [eq(lin(1, -4), num(9)), eq(lin(1, 0), num(13))],
  },
  {
    id: 'share-it-out',
    name: 'Share it out',
    rarity: 'common',
    tone: 'cobalt',
    skill: 'one-step',
    rule: 'Divide both sides by the number in front of x.',
    working: [eq(lin(3, 0), num(12)), eq(lin(1, 0), num(4))],
  },
  {
    id: 'times-it-up',
    name: 'Times it up',
    rarity: 'common',
    tone: 'hi',
    skill: 'one-step',
    rule: 'Multiply both sides by the same number to undo a divide.',
    working: [eq(fraction(1, 0, 4), num(3)), eq(lin(1, 0), num(12))],
  },
  {
    id: 'check-it',
    name: 'Check it',
    rarity: 'common',
    tone: 'tick',
    skill: null,
    rule: 'Put your answer back in for x. Do both sides match?',
    working: [eq(lin(2, 3), num(11)), 'Try x = 4', '2 × 4 + 3 = 11'],
  },
  {
    id: 'undo-in-order',
    name: 'Undo in order',
    rarity: 'rare',
    tone: 'hi',
    skill: 'two-step',
    rule: 'Undo the plus or minus first, then the times or divide.',
    working: [eq(lin(2, 3), num(11)), eq(lin(2, 0), num(8)), eq(lin(1, 0), num(4))],
  },
  {
    id: 'collect-the-x',
    name: 'Collect the x',
    rarity: 'rare',
    tone: 'box',
    skill: 'both-sides',
    rule: 'x on both sides? Subtract the smaller x term from both sides.',
    working: [eq(lin(5, -2), lin(3, 8)), eq(lin(2, -2), num(8))],
  },
  {
    id: 'open-the-brackets',
    name: 'Open the brackets',
    rarity: 'rare',
    tone: 'cobalt',
    skill: 'brackets',
    rule: 'Multiply everything inside the brackets by the number outside.',
    working: [eq({ kind: 'bracket', k: 3, inner: { a: 1, b: 2 }, plus: 0 }, num(21)), eq(lin(3, 6), num(21))],
  },
  {
    id: 'clear-the-fraction',
    name: 'Clear the fraction',
    rarity: 'rare',
    tone: 'cross',
    skill: 'fractions-negatives',
    rule: 'Multiply both sides by the bottom number and the fraction is gone.',
    working: [eq(fraction(1, 1, 2), num(5)), eq(lin(1, 1), num(10))],
  },
  {
    id: 'flip-the-sign',
    name: 'Flip the sign',
    rarity: 'rare',
    tone: 'tick',
    skill: 'fractions-negatives',
    rule: 'Stuck with −x? Multiply both sides by −1 and every sign flips.',
    working: [eq(lin(-1, 0), num(7)), eq(lin(1, 0), num(-7))],
  },
  {
    id: 'keep-it-level',
    name: 'Keep it level',
    rarity: 'holo',
    tone: 'hi',
    skill: null,
    rule: 'Whatever you do to one side, do the same to the other.',
    working: [eq(lin(1, 5), num(12)), 'x + 5 − 5 = 12 − 5'],
  },
  {
    id: 'found-x',
    name: 'Found x',
    rarity: 'holo',
    tone: 'box',
    skill: null,
    rule: 'Every move has one goal: x alone on one side.',
    working: [eq(lin(2, 3), num(11)), eq(lin(1, 0), num(4))],
  },
]

export const moveInfo = (id: MoveId): MoveCard => MOVES.find((card) => card.id === id)!

/** A card's place in the album, counting from 1. */
export const moveNumber = (id: MoveId): number => MOVES.findIndex((card) => card.id === id) + 1
