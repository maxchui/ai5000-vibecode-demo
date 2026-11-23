import { describe, expect, it } from 'vitest'
import { FLASHCARDS } from '../content/flashcards'
import { LAB_PRESETS } from '../engine/lab'
import { applyAnswer, applyCard, applyLabSolve, demoProfile, freshProfile, type Profile } from './profile'
import {
  dayKey,
  lastDays,
  levelInfo,
  liveStreak,
  mastery,
  shiftDay,
  streakAfter,
  toUnlock,
  xpForAnswer,
  xpToReach,
} from './progress'

const TODAY = '2026-11-23'
const right = (p: Profile, skill: Parameters<typeof applyAnswer>[1]['skill'], day = TODAY, ms = 20000) =>
  applyAnswer(p, { skill, correct: true, hintsUsed: 0, ms }, day)
const wrong = (p: Profile, skill: Parameters<typeof applyAnswer>[1]['skill'], day = TODAY) =>
  applyAnswer(p, { skill, correct: false, hintsUsed: 0, ms: 20000 }, day)

describe('levels and XP', () => {
  it('each level costs 50 XP more than the one before', () => {
    expect([1, 2, 3, 4, 5].map(xpToReach)).toEqual([0, 100, 250, 450, 700])
    expect(levelInfo(0)).toMatchObject({ level: 1, into: 0, span: 100, toGo: 100 })
    expect(levelInfo(99).level).toBe(1)
    expect(levelInfo(100)).toMatchObject({ level: 2, into: 0, span: 150 })
    expect(levelInfo(668)).toMatchObject({ level: 4, title: 'Step master', toGo: 32 })
    expect(levelInfo(100000).title).toBe('Legend of X')
  })

  it('pays less for hints and more for a run of right answers', () => {
    expect(xpForAnswer(15, 0, 0)).toBe(15)
    expect(xpForAnswer(15, 2, 0)).toBe(9)
    expect(xpForAnswer(10, 3, 0)).toBe(5)
    expect(xpForAnswer(15, 0, 3)).toBe(21)
    expect(xpForAnswer(15, 0, 40)).toBe(25)
  })
})

describe('days and streaks', () => {
  it('moves across month and year ends', () => {
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28')
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01')
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(lastDays(TODAY, 3)).toEqual(['2026-11-21', '2026-11-22', '2026-11-23'])
  })

  it('grows by one a day, holds within a day, and restarts after a gap', () => {
    expect(streakAfter(0, null, TODAY)).toBe(1)
    expect(streakAfter(4, '2026-11-22', TODAY)).toBe(5)
    expect(streakAfter(4, TODAY, TODAY)).toBe(4)
    expect(streakAfter(4, '2026-11-20', TODAY)).toBe(1)
    expect(liveStreak(4, '2026-11-22', TODAY)).toBe(4)
    expect(liveStreak(4, '2026-11-21', TODAY)).toBe(0)
  })
})

describe('answering questions', () => {
  it('a first right answer earns XP, a badge and a one-day streak', () => {
    const out = right(freshProfile(), 'one-step')
    expect(out.xp).toBe(10)
    expect(out.profile).toMatchObject({ xp: 10, streak: 1, combo: 1, answered: 1, correct: 1 })
    expect(out.profile.daily[TODAY]).toBe(10)
    expect(out.cheers).toContainEqual({ kind: 'badge', badge: 'first-solve' })
  })

  it('a wrong answer earns nothing and breaks the combo', () => {
    let p = right(freshProfile(), 'one-step').profile
    p = right(p, 'one-step').profile
    const out = wrong(p, 'one-step')
    expect(out.xp).toBe(0)
    expect(out.profile).toMatchObject({ combo: 0, bestCombo: 2, xp: p.xp, lastWasMiss: true })
  })

  it('five right out of the last ten opens the next skill, once', () => {
    let p = freshProfile()
    const cheers = []
    for (let n = 0; n < 5; n++) {
      expect(p.unlocked).toEqual(['one-step'])
      expect(toUnlock(p.skills['one-step'])).toBe(5 - n)
      const out = right(p, 'one-step')
      p = out.profile
      cheers.push(...out.cheers)
    }
    expect(mastery(p.skills['one-step'])).toBe(50)
    expect(p.unlocked).toEqual(['one-step', 'two-step'])
    expect(cheers.filter((c) => c.kind === 'unlock')).toEqual([{ kind: 'unlock', skill: 'two-step' }])
    expect(right(p, 'one-step').cheers.some((c) => c.kind === 'unlock')).toBe(false)
  })

  it('a skill stays open even if mastery later drops', () => {
    let p = freshProfile()
    for (let n = 0; n < 5; n++) p = right(p, 'one-step').profile
    for (let n = 0; n < 10; n++) p = wrong(p, 'one-step').profile
    expect(mastery(p.skills['one-step'])).toBe(0)
    expect(p.unlocked).toContain('two-step')
  })

  it('gives the run, speed and comeback badges at the right moments', () => {
    let p = freshProfile()
    const seen: string[] = []
    const play = (out: ReturnType<typeof right>) => {
      p = out.profile
      for (const c of out.cheers) if (c.kind === 'badge') seen.push(c.badge)
    }
    play(wrong(p, 'one-step'))
    play(right(p, 'one-step', TODAY, 3000))
    expect(seen).toEqual(['first-solve', 'lightning', 'bounce-back'])
    for (let n = 0; n < 4; n++) play(right(p, 'one-step'))
    expect(seen).toContain('on-fire')
    expect(seen).toContain('brain-power')
    // Badges are only ever given once.
    for (let n = 0; n < 10; n++) play(right(p, 'one-step', TODAY, 3000))
    expect(new Set(seen).size).toBe(seen.length)
  })
})

describe('balance lab and flashcards', () => {
  it('pays most for a set challenge the first time', () => {
    const first = applyLabSolve(freshProfile(), 'warm-up', TODAY)
    expect(first).toMatchObject({ xp: 15, first: true })
    expect(first.cheers).toContainEqual({ kind: 'badge', badge: 'balanced' })
    const again = applyLabSolve(first.profile, 'warm-up', TODAY)
    expect(again).toMatchObject({ xp: 5, first: false })
    expect(again.profile.labSolved).toEqual(['warm-up'])
    expect(applyLabSolve(again.profile, null, TODAY)).toMatchObject({ xp: 8, first: false })
  })

  it('gives the scale badge when all six set challenges are done', () => {
    let p = freshProfile()
    let last = applyLabSolve(p, LAB_PRESETS[0].id, TODAY)
    for (const lab of LAB_PRESETS) {
      last = applyLabSolve(p, lab.id, TODAY)
      p = last.profile
    }
    expect(last.cheers).toContainEqual({ kind: 'badge', badge: 'scale-master' })
  })

  it('only newly known cards earn XP, and knowing them all earns the badge', () => {
    let p = freshProfile()
    expect(applyCard(p, FLASHCARDS[0].id, false, TODAY).xp).toBe(0)
    let last = applyCard(p, FLASHCARDS[0].id, true, TODAY)
    expect(last.xp).toBe(3)
    expect(applyCard(last.profile, FLASHCARDS[0].id, true, TODAY).xp).toBe(0)
    for (const card of FLASHCARDS) {
      last = applyCard(p, card.id, true, TODAY)
      p = last.profile
    }
    expect(last.cheers).toContainEqual({ kind: 'badge', badge: 'card-collector' })
  })
})

describe('demo player', () => {
  const demo = demoProfile(TODAY, 'Sam')

  it('is consistent with itself', () => {
    expect(demo.xp).toBe(668)
    expect(Object.values(demo.daily).reduce((a, b) => a + b, 0)).toBe(demo.xp)
    expect(demo.daily[TODAY]).toBeUndefined()
    expect(liveStreak(demo.streak, demo.lastActive, TODAY)).toBe(6)
    // The six days before today were all active, the seventh was not.
    for (let d = 1; d <= 6; d++) expect(demo.daily[shiftDay(TODAY, -d)]).toBeGreaterThan(0)
    expect(demo.daily[shiftDay(TODAY, -7)]).toBeUndefined()
    const totals = Object.values(demo.skills)
    expect(totals.reduce((a, s) => a + s.attempts, 0)).toBe(demo.answered)
    expect(totals.reduce((a, s) => a + s.correct, 0)).toBe(demo.correct)
    for (const s of totals) expect(s.recent.length).toBeLessThanOrEqual(Math.min(10, s.attempts))
    expect(Object.keys(demo.badges)).toHaveLength(8)
  })

  it('makes a 7-day streak with the first XP of the day', () => {
    const out = right(demo, 'one-step')
    expect(out.profile.streak).toBe(7)
    expect(out.cheers).toContainEqual({ kind: 'badge', badge: 'week-warrior' })
  })

  it('opens the last skill with one more right answer in Brackets', () => {
    expect(demo.unlocked).not.toContain('fractions-negatives')
    expect(toUnlock(demo.skills.brackets)).toBe(1)
    const out = right(demo, 'brackets')
    expect(out.cheers).toContainEqual({ kind: 'unlock', skill: 'fractions-negatives' })
  })

  it('reaches level 5 within two right answers in Brackets', () => {
    const one = right(demo, 'brackets')
    expect(one.profile.xp).toBe(693)
    const two = right(one.profile, 'brackets')
    expect(two.cheers).toContainEqual({ kind: 'level', level: 5, title: 'Bracket buster' })
    expect(two.cheers).toContainEqual({ kind: 'badge', badge: 'high-five' })
  })

  it('completes the Balance Lab set with the last two challenges', () => {
    const five = applyLabSolve(demo, LAB_PRESETS[4].id, TODAY)
    expect(five.first).toBe(true)
    const six = applyLabSolve(five.profile, LAB_PRESETS[5].id, TODAY)
    expect(six.cheers).toContainEqual({ kind: 'badge', badge: 'scale-master' })
  })
})
