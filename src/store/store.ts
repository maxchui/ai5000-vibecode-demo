import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { SkillId } from '../engine/types'
import { setMuted } from '../lib/sfx'
import type { BadgeId } from './badges'
import {
  applyAnswer,
  applyCard,
  applyLabSolve,
  demoProfile,
  freshProfile,
  type AnswerInput,
  type Cheer,
  type Outcome,
  type Profile,
} from './profile'
import { dayKey } from './progress'

export type Tab = 'home' | 'lab' | 'practice' | 'cards' | 'progress'

/**
 * What the celebration screen shows. Badges earned in the same moment share
 * one screen, so a good answer is never followed by three pop-ups in a row.
 */
export type Celebration = (Exclude<Cheer, { kind: 'badge' }> | { kind: 'badges'; badges: BadgeId[] }) & {
  key: number
}

interface Store {
  profile: Profile
  muted: boolean

  // Not saved: where we are and what is on screen right now.
  tab: Tab
  /** A skill to open straight away when Practice is shown. */
  practiceSkill: SkillId | null
  celebrations: Celebration[]
  /** The latest XP award, so the top bar can show "+15". */
  lastGain: { amount: number; key: number } | null
  /** A short message shown at the bottom of the screen for a moment. */
  toast: { text: string; key: number } | null

  go: (tab: Tab, skill?: SkillId) => void
  clearPracticeSkill: () => void
  welcome: (name: string) => void
  rename: (name: string) => void
  toggleMuted: () => void
  answer: (input: AnswerInput) => { xp: number; combo: number }
  solveLab: (presetId: string | null) => { xp: number; first: boolean }
  rateCard: (id: string, known: boolean) => { xp: number }
  dismissCelebration: () => void
  loadDemo: () => void
  reset: () => void
}

let counter = 0

/** If the browser will not give us storage, keep things in memory for this visit. */
function storage(): StateStorage {
  try {
    const probe = '__find-x'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    const memory = new Map<string, string>()
    return {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => void memory.set(key, value),
      removeItem: (key) => void memory.delete(key),
    }
  }
}

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      const commit = (out: Outcome) => {
        const queue: Celebration[] = []
        const badges: BadgeId[] = []
        for (const cheer of out.cheers) {
          if (cheer.kind === 'badge') badges.push(cheer.badge)
          else queue.push({ ...cheer, key: ++counter })
        }
        if (badges.length > 0) queue.push({ kind: 'badges', badges, key: ++counter })
        set((s) => ({
          profile: out.profile,
          celebrations: [...s.celebrations, ...queue],
          lastGain: out.xp > 0 ? { amount: out.xp, key: ++counter } : s.lastGain,
        }))
      }

      return {
        profile: freshProfile(),
        muted: false,
        tab: 'home',
        practiceSkill: null,
        celebrations: [],
        lastGain: null,
        toast: null,

        go: (tab, skill) => set({ tab, practiceSkill: skill ?? null }),
        clearPracticeSkill: () => set({ practiceSkill: null }),

        welcome: (name) =>
          set((s) => ({ profile: { ...s.profile, name: name.trim() || 'Solver', welcomed: true } })),

        rename: (name) => set((s) => ({ profile: { ...s.profile, name } })),

        toggleMuted: () => set((s) => ({ muted: !s.muted })),

        answer: (input) => {
          const out = applyAnswer(get().profile, input, dayKey())
          commit(out)
          return { xp: out.xp, combo: out.profile.combo }
        },

        solveLab: (presetId) => {
          const out = applyLabSolve(get().profile, presetId, dayKey())
          commit(out)
          return { xp: out.xp, first: out.first }
        },

        rateCard: (id, known) => {
          const out = applyCard(get().profile, id, known, dayKey())
          commit(out)
          return { xp: out.xp }
        },

        dismissCelebration: () => set((s) => ({ celebrations: s.celebrations.slice(1) })),

        loadDemo: () =>
          set((s) => ({
            profile: demoProfile(dayKey(), s.profile.name.trim() || 'Sam'),
            celebrations: [],
            lastGain: null,
            tab: 'home',
            practiceSkill: null,
            toast: { text: 'Demo player loaded', key: ++counter },
          })),

        reset: () =>
          set({
            profile: freshProfile(),
            celebrations: [],
            lastGain: null,
            tab: 'home',
            practiceSkill: null,
            toast: { text: 'Started again from zero', key: ++counter },
          }),
      }
    },
    {
      name: 'find-x:v1',
      storage: createJSONStorage(storage),
      partialize: (s) => ({ profile: s.profile, muted: s.muted }),
      // Fill in anything a saved profile from an older build is missing.
      merge: (saved, current) => {
        const from = (saved ?? {}) as Partial<Pick<Store, 'profile' | 'muted'>>
        return {
          ...current,
          muted: from.muted ?? current.muted,
          profile: { ...current.profile, ...from.profile },
        }
      },
    },
  ),
)

setMuted(useStore.getState().muted)
useStore.subscribe((s) => setMuted(s.muted))

/** The player's name, with a stand-in until they have given one. */
export const useName = () => useStore((s) => s.profile.name.trim() || 'Solver')
