import { Check, X as Cross } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Bubble, Coach, type Mood } from '../../components/Coach'
import { Pack } from '../../components/Pack'
import { Ring } from '../../components/Ring'
import { Rich } from '../../components/X'
import { SKILLS, skillInfo } from '../../engine/generate'
import type { SkillId } from '../../engine/types'
import { shower } from '../../lib/confetti'
import { sfx } from '../../lib/sfx'
import { mastery, MASTERED_AT } from '../../store/progress'
import { useStore } from '../../store/store'
import type { RoundSummary } from './Round'

export function Results({
  skill,
  summary,
  onAgain,
  onMap,
  onStart,
}: {
  skill: SkillId
  summary: RoundSummary
  onAgain: () => void
  onMap: () => void
  onStart: (id: SkillId) => void
}) {
  const now = useStore((s) => mastery(s.profile.skills[skill]))
  const unlocked = useStore((s) => s.profile.unlocked)
  const packs = useStore((s) => s.profile.packs)
  const openPack = useStore((s) => s.openPack)
  const go = useStore((s) => s.go)
  const info = skillInfo(skill)
  const right = summary.results.filter(Boolean).length
  const total = summary.results.length
  const perfect = right === total

  // The ring starts where mastery was before the round, then moves to where it is now.
  const [shown, setShown] = useState(summary.masteryBefore)
  useEffect(() => {
    const timer = window.setTimeout(() => setShown(now), 500)
    return () => window.clearTimeout(timer)
  }, [now])

  useEffect(() => {
    if (!perfect) return
    sfx.cheer()
    shower()
  }, [perfect])

  const harder = SKILLS[SKILLS.findIndex((s) => s.id === skill) + 1]
  const suggestHarder = harder && unlocked.includes(harder.id) && now >= 70

  const mood: Mood = right >= 4 ? 'cheer' : right === 3 ? 'happy' : 'think'
  const verdict = perfect
    ? 'A perfect round. Every single one.'
    : right >= 4
      ? 'Strong round. One slip, and you know where it was.'
      : right === 3
        ? 'More right than wrong. Another round will tighten it up.'
        : 'That was a tough one. The steps after each miss show the way, so have another go.'
  const change = now - summary.masteryBefore

  return (
    <div className="flex h-full items-center justify-center gap-12">
      <div className="flex w-[21rem] flex-col items-center gap-4">
        <Bubble tail="bottom" className="w-full">
          <p>{verdict}</p>
        </Bubble>
        <Coach mood={mood} className="h-52 w-52" />
      </div>

      <motion.div
        className="sheet w-[34rem] px-10 py-9"
        initial={{ scale: 0.9, rotate: 2, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      >
        <p className="text-lg">
          <Rich text={info.name} />
        </p>
        <h2 className="mt-1 text-5xl font-black">
          {right} out of {total}
        </h2>

        <ol className="mt-5 flex gap-2.5" aria-label="How each question went">
          {summary.results.map((ok, i) => (
            <motion.li
              key={i}
              className={`grid h-11 w-11 place-items-center rounded-full border-2 border-ink text-white ${ok ? 'bg-tick' : 'bg-cross'}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.25 + i * 0.1 }}
            >
              {ok ? (
                <Check className="h-6 w-6" strokeWidth={3.6} aria-label="right" />
              ) : (
                <Cross className="h-6 w-6" strokeWidth={3.6} aria-label="wrong" />
              )}
            </motion.li>
          ))}
        </ol>

        <div className="mt-7 flex items-center gap-8">
          <div>
            <p className="font-display text-4xl font-black">
              <span className="marked">+{summary.xp} XP</span>
            </p>
            <p className="mt-2 text-base">earned this round</p>
          </div>
          <div className="flex items-center gap-4">
            <Ring
              value={shown}
              colour={shown >= MASTERED_AT ? 'var(--color-tick)' : 'var(--color-cobalt)'}
              track={shown >= MASTERED_AT ? 'var(--color-tick-pale)' : 'var(--color-sky)'}
              outlined={false}
              label={`${now}% mastered`}
              className="h-24 w-24"
            >
              <span className="tabular font-display text-xl font-black">{now}%</span>
            </Ring>
            <p className="text-base leading-snug">
              mastered
              <br />
              {change > 0 ? `up ${change} points` : change < 0 ? `down ${-change} points` : 'no change'}
            </p>
          </div>
        </div>

        {/* Every finished round earns a pack. Once it is opened, this turns into the way to the collection. */}
        <div className="mt-7 flex items-center gap-4 rounded-2xl bg-sky py-3 pr-4 pl-5">
          {packs > 0 ? (
            <>
              <Pack className="h-[4.5rem] shrink-0 -rotate-6" />
              <p className="min-w-0 leading-snug">
                <span className="block font-display text-xl font-bold">You earned a pack</span>
                <span className="block text-base">
                  {packs === 1 ? 'Three move cards for your collection.' : `You have ${packs} packs to open.`}
                </span>
              </p>
              <button type="button" autoFocus className="key key-hi ml-auto shrink-0" onClick={openPack}>
                Open the pack
              </button>
            </>
          ) : (
            <>
              <p className="min-w-0 py-1 text-base leading-snug">Your new cards are in the collection.</p>
              <button type="button" className="link ml-auto shrink-0" onClick={() => go('collection')}>
                See the collection
              </button>
            </>
          )}
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" autoFocus={packs === 0} className="key key-primary" onClick={onAgain}>
            Play another round
          </button>
          {suggestHarder && (
            <button type="button" className="key key-hi" onClick={() => onStart(harder.id)}>
              <span>
                Try <Rich text={harder.name} />
              </span>
            </button>
          )}
          <button type="button" className="key" onClick={onMap}>
            Back to skills
          </button>
        </div>
      </motion.div>
    </div>
  )
}
