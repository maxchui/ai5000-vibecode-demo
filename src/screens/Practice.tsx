import { useEffect, useState } from 'react'
import { SKILL_ORDER } from '../engine/generate'
import type { SkillId } from '../engine/types'
import { sfx } from '../lib/sfx'
import { mastery, MASTERED_AT } from '../store/progress'
import { useStore } from '../store/store'
import { LevelMap } from './practice/LevelMap'
import { Results } from './practice/Results'
import { Round, type RoundSummary } from './practice/Round'

type View =
  | { at: 'map' }
  | { at: 'round'; skill: SkillId; key: number }
  | { at: 'results'; skill: SkillId; summary: RoundSummary }

/** The skill most worth playing next: the hardest one that is open and not yet mastered. */
export function suggestedSkill(): SkillId {
  const { unlocked, skills } = useStore.getState().profile
  const open = SKILL_ORDER.filter((id) => unlocked.includes(id))
  return [...open].reverse().find((id) => mastery(skills[id]) < MASTERED_AT) ?? open[open.length - 1]
}

export function Practice() {
  const asked = useStore((s) => s.practiceSkill)
  const clearAsked = useStore((s) => s.clearPracticeSkill)
  const finishRound = useStore((s) => s.finishRound)
  const [selected, setSelected] = useState<SkillId>(
    () => useStore.getState().practiceSkill ?? suggestedSkill(),
  )
  const [view, setView] = useState<View>({ at: 'map' })

  // Another screen can send the player here with a skill already picked.
  useEffect(() => {
    if (!asked) return
    setSelected(asked)
    setView({ at: 'map' })
    clearAsked()
  }, [asked, clearAsked])

  const start = (skill: SkillId) => {
    sfx.pop()
    setSelected(skill)
    setView({ at: 'round', skill, key: Date.now() })
  }

  switch (view.at) {
    case 'map':
      return <LevelMap selected={selected} onSelect={setSelected} onStart={start} />
    case 'round':
      return (
        <Round
          key={view.key}
          skill={view.skill}
          onLeave={() => setView({ at: 'map' })}
          onDone={(summary) => {
            finishRound()
            setView({ at: 'results', skill: view.skill, summary })
          }}
        />
      )
    case 'results':
      return (
        <Results
          skill={view.skill}
          summary={view.summary}
          onAgain={() => start(view.skill)}
          onMap={() => setView({ at: 'map' })}
          onStart={start}
        />
      )
  }
}
