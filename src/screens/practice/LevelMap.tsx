import { Lock, Play, Star } from 'lucide-react'
import { Bubble, Coach } from '../../components/Coach'
import { Maths } from '../../components/Maths'
import { Ring } from '../../components/Ring'
import { Rich } from '../../components/X'
import { SKILLS, type SkillInfo } from '../../engine/generate'
import type { SkillId } from '../../engine/types'
import { sfx } from '../../lib/sfx'
import { mastery, MASTERED_AT, toUnlock, WINDOW } from '../../store/progress'
import { useStore } from '../../store/store'

/** Where each skill sits along the path, as percentages of the map. */
const NODES = [
  { x: 9, y: 64 },
  { x: 29.5, y: 30 },
  { x: 50, y: 64 },
  { x: 70.5, y: 30 },
  { x: 91, y: 64 },
]

const PATH = 'M9 64C17 64 21 30 29.5 30S42 64 50 64 62 30 70.5 30 83 64 91 64'

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export function LevelMap({
  selected,
  onSelect,
  onStart,
}: {
  selected: SkillId
  onSelect: (id: SkillId) => void
  onStart: (id: SkillId) => void
}) {
  const skills = useStore((s) => s.profile.skills)
  const unlocked = useStore((s) => s.profile.unlocked)

  const index = SKILLS.findIndex((s) => s.id === selected)
  const skill = SKILLS[index]
  const stats = skills[selected]
  const open = unlocked.includes(selected)
  const percent = mastery(stats)
  const before: SkillInfo | undefined = SKILLS[index - 1]
  const after: SkillInfo | undefined = SKILLS[index + 1]
  const rightLately = stats.recent.filter(Boolean).length

  let advice: string
  if (!open && before) {
    advice = `This one is locked. Get ${plural(toUnlock(skills[before.id]), 'more right answer')} in ${before.name} to open it.`
  } else if (percent >= MASTERED_AT) {
    advice = after
      ? 'You have mastered this one. Play it for XP, or pick something harder.'
      : 'You have mastered the hardest skill there is. Play it again for XP.'
  } else if (after && !unlocked.includes(after.id)) {
    advice = `${plural(toUnlock(stats), 'more right answer')} here opens ${after.name}.`
  } else {
    advice = 'A round is 5 questions. A hint costs 3 XP, and a run of right answers earns extra.'
  }

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="relative min-h-0 flex-1">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <path
            d={PATH}
            fill="none"
            stroke="var(--color-mist)"
            strokeWidth="5"
            strokeDasharray="2 14"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {SKILLS.map((s, i) => {
          const isOpen = unlocked.includes(s.id)
          const m = mastery(skills[s.id])
          const mastered = m >= MASTERED_AT
          const current = s.id === selected
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                sfx.tap()
                onSelect(s.id)
              }}
              aria-pressed={current}
              style={{ left: `${NODES[i].x}%`, top: `${NODES[i].y}%` }}
              className="group absolute flex w-52 -translate-x-1/2 -translate-y-[3.75rem] flex-col items-center rounded-2xl text-center"
            >
              <Ring
                value={isOpen ? m : 0}
                colour={mastered ? 'var(--color-tick)' : 'var(--color-cobalt)'}
                track={isOpen ? 'var(--color-white)' : 'var(--color-sky)'}
                label={`${s.name}: ${isOpen ? `${m}% mastered` : 'locked'}`}
                className={`h-[7.5rem] w-[7.5rem] transition-transform group-hover:scale-105 ${current ? 'scale-110' : ''}`}
              >
                <span
                  className={`grid h-[4.6rem] w-[4.6rem] place-items-center rounded-full font-display text-4xl font-black ${
                    current ? 'bg-hi' : 'bg-white'
                  } ${isOpen ? '' : 'text-mist'}`}
                >
                  {!isOpen ? (
                    <Lock className="h-8 w-8" strokeWidth={2.6} aria-hidden />
                  ) : mastered ? (
                    <Star className="h-9 w-9" strokeWidth={2.4} fill="var(--color-hi)" aria-hidden />
                  ) : (
                    i + 1
                  )}
                </span>
              </Ring>
              <span
                className={`mt-3 font-display text-lg leading-tight font-bold ${current ? 'marked' : ''}`}
              >
                <Rich text={s.name} />
              </span>
              <span className="mt-1 text-sm">{isOpen ? `${m}% mastered` : 'Locked'}</span>
            </button>
          )
        })}
      </div>

      <div className="flex shrink-0 items-end gap-5">
        <Coach mood={open ? 'idle' : 'think'} className="h-28 w-28 shrink-0" />
        <div className="flex min-w-0 flex-1 items-stretch gap-6">
          <Bubble className="flex min-w-0 flex-1 flex-col justify-center">
            <h2 className="text-2xl">
              <Rich text={skill.name} />
            </h2>
            <p className="mt-1.5">
              <Rich text={`${skill.blurb} ${advice}`} />
            </p>
          </Bubble>

          <div className="flex shrink-0 flex-col items-center justify-center gap-3 px-2">
            <Maths eq={skill.example} className="text-4xl" />
            <p className="text-sm">
              {stats.attempts === 0
                ? `${skill.baseXp} XP for each right answer`
                : `${rightLately} right in your last ${Math.min(stats.attempts, WINDOW)}`}
            </p>
          </div>

          <button
            type="button"
            disabled={!open}
            onClick={() => onStart(selected)}
            className="key key-primary key-lg shrink-0 self-center"
          >
            {open ? (
              <Play className="h-6 w-6" strokeWidth={2.6} fill="currentColor" aria-hidden />
            ) : (
              <Lock className="h-6 w-6" strokeWidth={2.6} aria-hidden />
            )}
            {open ? 'Start a round' : 'Locked'}
          </button>
        </div>
      </div>
    </div>
  )
}
