import { SKILL_ORDER } from '../engine/generate'
import type { SkillId } from '../engine/types'

/** How a player is doing on one skill. `recent` holds the last ten results. */
export interface SkillStats {
  attempts: number
  correct: number
  recent: boolean[]
}

export const emptySkill = (): SkillStats => ({ attempts: 0, correct: 0, recent: [] })

export const emptySkills = (): Record<SkillId, SkillStats> =>
  Object.fromEntries(SKILL_ORDER.map((id) => [id, emptySkill()])) as Record<SkillId, SkillStats>

/** Mastery looks at the last ten answers, so it can be won back after a bad patch. */
export const WINDOW = 10
/** Mastery needed in one skill to open the next. */
export const UNLOCK_AT = 50
/** Mastery at which a skill counts as mastered. */
export const MASTERED_AT = 90
export const DAILY_GOAL = 60

export const mastery = (s: SkillStats): number => Math.round((s.recent.filter(Boolean).length / WINDOW) * 100)

export const recordResult = (s: SkillStats, correct: boolean): SkillStats => ({
  attempts: s.attempts + 1,
  correct: s.correct + (correct ? 1 : 0),
  recent: [...s.recent, correct].slice(-WINDOW),
})

/** Right answers still needed before the next skill opens. */
export const toUnlock = (s: SkillStats): number =>
  Math.max(0, Math.ceil(((UNLOCK_AT - mastery(s)) / 100) * WINDOW))

export const LEVEL_TITLES = [
  'Rookie solver',
  'Number wrangler',
  'Balance keeper',
  'Step master',
  'Bracket buster',
  'X hunter',
  'Equation ace',
  'Algebra ninja',
  'Variable wizard',
  'Legend of X',
]

/** Total XP needed to stand on a level. Each level costs 50 more than the last: 100, 150, 200… */
export const xpToReach = (level: number): number => 25 * (level - 1) * (level + 2)

export interface LevelInfo {
  level: number
  title: string
  /** XP earned inside this level. */
  into: number
  /** XP this level takes from start to finish. */
  span: number
  /** XP still needed for the next level. */
  toGo: number
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1
  while (xp >= xpToReach(level + 1)) level++
  const floor = xpToReach(level)
  const span = xpToReach(level + 1) - floor
  return {
    level,
    title: LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1],
    into: xp - floor,
    span,
    toGo: span - (xp - floor),
  }
}

/** XP for a right answer: fewer for each hint used, more for a run of right answers. */
export function xpForAnswer(baseXp: number, hintsUsed: number, comboBefore: number): number {
  return Math.max(5, baseXp - 3 * hintsUsed) + 2 * Math.min(comboBefore, 5)
}

const pad = (n: number) => `${n}`.padStart(2, '0')

/** A calendar day in the player's own time zone: "2026-11-23". */
export const dayKey = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function shiftDay(key: string, by: number): string {
  const [y, m, d] = key.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d + by))
}

/** The streak once something has been done today. */
export function streakAfter(streak: number, lastActive: string | null, today: string): number {
  if (lastActive === today) return Math.max(streak, 1)
  if (lastActive === shiftDay(today, -1)) return streak + 1
  return 1
}

/** The streak to show right now: it lapses if a whole day was missed. */
export function liveStreak(streak: number, lastActive: string | null, today: string): number {
  return lastActive === today || lastActive === shiftDay(today, -1) ? streak : 0
}

/** The last `count` days, oldest first, ending today. */
export function lastDays(today: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => shiftDay(today, i - count + 1))
}
