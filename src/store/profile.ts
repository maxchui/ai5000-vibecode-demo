import { FLASHCARDS } from '../content/flashcards'
import { SKILL_ORDER, skillInfo } from '../engine/generate'
import { LAB_PRESETS } from '../engine/lab'
import type { SkillId } from '../engine/types'
import type { BadgeId } from './badges'
import {
  emptySkills,
  levelInfo,
  mastery,
  MASTERED_AT,
  recordResult,
  shiftDay,
  streakAfter,
  UNLOCK_AT,
  xpForAnswer,
  type SkillStats,
} from './progress'

/** Everything remembered about one player. Saved in the browser. */
export interface Profile {
  name: string
  /** False until the welcome screen has been answered. */
  welcomed: boolean
  xp: number
  streak: number
  lastActive: string | null
  /** XP earned on each day, keyed by date. */
  daily: Record<string, number>
  skills: Record<SkillId, SkillStats>
  unlocked: SkillId[]
  answered: number
  correct: number
  /** Right answers in a row, right now. */
  combo: number
  bestCombo: number
  /** Right answers in a row without a hint. */
  cleanRun: number
  lastWasMiss: boolean
  /** Ids of the set Balance Lab challenges solved at least once. */
  labSolved: string[]
  labRandom: number
  /** Flashcard id to pile: 1 still learning, 2 known. Missing means not seen yet. */
  cards: Record<string, number>
  /** Badge id to the date it was earned. */
  badges: Partial<Record<BadgeId, string>>
}

export const CARD_LEARNING = 1
export const CARD_KNOWN = 2

/** Something worth stopping the game to celebrate. */
export type Cheer =
  | { kind: 'level'; level: number; title: string }
  | { kind: 'badge'; badge: BadgeId }
  | { kind: 'unlock'; skill: SkillId }

export interface Outcome {
  profile: Profile
  cheers: Cheer[]
  xp: number
}

export const freshProfile = (): Profile => ({
  name: '',
  welcomed: false,
  xp: 0,
  streak: 0,
  lastActive: null,
  daily: {},
  skills: emptySkills(),
  unlocked: [SKILL_ORDER[0]],
  answered: 0,
  correct: 0,
  combo: 0,
  bestCombo: 0,
  cleanRun: 0,
  lastWasMiss: false,
  labSolved: [],
  labRandom: 0,
  cards: {},
  badges: {},
})

/** Add XP: this also marks today as active, moves the streak on and spots a new level. */
function gain(p: Profile, amount: number, today: string): { profile: Profile; cheers: Cheer[] } {
  if (amount <= 0) return { profile: p, cheers: [] }
  const before = levelInfo(p.xp).level
  const xp = p.xp + amount
  const after = levelInfo(xp)
  return {
    profile: {
      ...p,
      xp,
      daily: { ...p.daily, [today]: (p.daily[today] ?? 0) + amount },
      streak: streakAfter(p.streak, p.lastActive, today),
      lastActive: today,
    },
    cheers: after.level > before ? [{ kind: 'level', level: after.level, title: after.title }] : [],
  }
}

interface Moment {
  /** The answer just given was right and quick. */
  fast?: boolean
  /** The answer just given was right, straight after a wrong one. */
  bounced?: boolean
}

/** Hand out any badge whose condition is now met. */
function withBadges(p: Profile, today: string, moment: Moment = {}): { profile: Profile; cheers: Cheer[] } {
  const rules: [BadgeId, boolean][] = [
    ['first-solve', p.correct >= 1],
    ['on-fire', p.bestCombo >= 5],
    ['brain-power', p.cleanRun >= 5],
    ['lightning', moment.fast === true],
    ['bounce-back', moment.bounced === true],
    ['balanced', p.labSolved.length + p.labRandom >= 1],
    ['scale-master', LAB_PRESETS.every((lab) => p.labSolved.includes(lab.id))],
    ['card-collector', FLASHCARDS.every((card) => p.cards[card.id] === CARD_KNOWN)],
    ['warming-up', p.streak >= 3],
    ['week-warrior', p.streak >= 7],
    ['high-five', levelInfo(p.xp).level >= 5],
    ['skill-master', SKILL_ORDER.some((id) => mastery(p.skills[id]) >= MASTERED_AT)],
  ]
  const earned = rules.filter(([id, met]) => met && p.badges[id] === undefined).map(([id]) => id)
  if (earned.length === 0) return { profile: p, cheers: [] }
  const badges = { ...p.badges }
  for (const id of earned) badges[id] = today
  return { profile: { ...p, badges }, cheers: earned.map((badge) => ({ kind: 'badge', badge })) }
}

export interface AnswerInput {
  skill: SkillId
  correct: boolean
  hintsUsed: number
  /** Time taken, in milliseconds. */
  ms: number
}

export function applyAnswer(p: Profile, input: AnswerInput, today: string): Outcome {
  const { skill, correct, hintsUsed, ms } = input
  const xp = correct ? xpForAnswer(skillInfo(skill).baseXp, hintsUsed, p.combo) : 0
  const bounced = correct && p.lastWasMiss
  const combo = correct ? p.combo + 1 : 0

  let profile: Profile = {
    ...p,
    answered: p.answered + 1,
    correct: p.correct + (correct ? 1 : 0),
    combo,
    bestCombo: Math.max(p.bestCombo, combo),
    cleanRun: correct && hintsUsed === 0 ? p.cleanRun + 1 : 0,
    lastWasMiss: !correct,
    skills: { ...p.skills, [skill]: recordResult(p.skills[skill], correct) },
  }
  const cheers: Cheer[] = []

  const next = SKILL_ORDER[SKILL_ORDER.indexOf(skill) + 1]
  if (next && !profile.unlocked.includes(next) && mastery(profile.skills[skill]) >= UNLOCK_AT) {
    profile = { ...profile, unlocked: [...profile.unlocked, next] }
    cheers.push({ kind: 'unlock', skill: next })
  }

  const gained = gain(profile, xp, today)
  const badged = withBadges(gained.profile, today, { fast: correct && ms < 8000, bounced })
  return { profile: badged.profile, cheers: [...cheers, ...gained.cheers, ...badged.cheers], xp }
}

/** XP for the Balance Lab: most for a set challenge the first time. */
export function applyLabSolve(
  p: Profile,
  presetId: string | null,
  today: string,
): Outcome & { first: boolean } {
  const first = presetId !== null && !p.labSolved.includes(presetId)
  const xp = presetId === null ? 8 : first ? 15 : 5
  const counted: Profile =
    presetId === null
      ? { ...p, labRandom: p.labRandom + 1 }
      : first
        ? { ...p, labSolved: [...p.labSolved, presetId] }
        : p
  const gained = gain(counted, xp, today)
  const badged = withBadges(gained.profile, today)
  return { profile: badged.profile, cheers: [...gained.cheers, ...badged.cheers], xp, first }
}

/** Sort a flashcard into "known" or "still learning". Only newly known cards earn XP. */
export function applyCard(p: Profile, id: string, known: boolean, today: string): Outcome {
  const xp = known && p.cards[id] !== CARD_KNOWN ? 3 : 0
  const sorted: Profile = { ...p, cards: { ...p.cards, [id]: known ? CARD_KNOWN : CARD_LEARNING } }
  const gained = gain(sorted, xp, today)
  const badged = withBadges(gained.profile, today)
  return { profile: badged.profile, cheers: [...gained.cheers, ...badged.cheers], xp }
}

const T = true
const F = false

/**
 * A player two weeks in, for showing the app off. It is set up so that good
 * things are about to happen:
 *   the next XP of the day makes a 7-day streak,
 *   32 more XP reaches level 5,
 *   one more right answer in Brackets opens the last skill,
 *   two more Balance Lab challenges complete the set.
 */
export function demoProfile(today: string, name: string): Profile {
  // XP for yesterday, the day before, and so on back for 13 days. Adds up to 668.
  const history = [58, 84, 46, 72, 35, 66, 0, 52, 90, 0, 41, 64, 60]
  const daily: Record<string, number> = {}
  history.forEach((xp, i) => {
    if (xp > 0) daily[shiftDay(today, -(i + 1))] = xp
  })
  const ago = (days: number) => shiftDay(today, -days)

  return {
    name,
    welcomed: true,
    xp: history.reduce((sum, xp) => sum + xp, 0),
    streak: 6,
    lastActive: ago(1),
    daily,
    skills: {
      'one-step': { attempts: 34, correct: 31, recent: [T, T, T, T, T, T, T, T, T, T] },
      'two-step': { attempts: 28, correct: 23, recent: [T, T, F, T, T, T, T, T, T, T] },
      'both-sides': { attempts: 19, correct: 13, recent: [T, F, T, T, F, T, T, T, F, T] },
      brackets: { attempts: 7, correct: 4, recent: [F, T, F, T, T, F, T] },
      'fractions-negatives': { attempts: 0, correct: 0, recent: [] },
    },
    unlocked: ['one-step', 'two-step', 'both-sides', 'brackets'],
    answered: 88,
    correct: 71,
    combo: 0,
    bestCombo: 8,
    cleanRun: 0,
    lastWasMiss: false,
    labSolved: LAB_PRESETS.slice(0, 4).map((lab) => lab.id),
    labRandom: 3,
    cards: Object.fromEntries(
      FLASHCARDS.slice(0, 13).map((card, i) => [card.id, i < 9 ? CARD_KNOWN : CARD_LEARNING]),
    ),
    badges: {
      'first-solve': ago(13),
      balanced: ago(13),
      'bounce-back': ago(12),
      lightning: ago(11),
      'on-fire': ago(9),
      'warming-up': ago(4),
      'skill-master': ago(3),
      'brain-power': ago(2),
    },
  }
}
