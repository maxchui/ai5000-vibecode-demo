import { Layers, Scale, Target, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useRef, useState } from 'react'
import { Bubble, Coach, type Mood } from '../components/Coach'
import { Maths } from '../components/Maths'
import { Ring } from '../components/Ring'
import { Rich, X } from '../components/X'
import { FLASHCARDS } from '../content/flashcards'
import { fmtNum } from '../engine/format'
import { generateProblem, SKILL_ORDER, SKILLS, skillInfo } from '../engine/generate'
import { LAB_PRESETS } from '../engine/lab'
import { makeQuestion, type Question } from '../engine/questions'
import type { SkillId } from '../engine/types'
import { burstFrom } from '../lib/confetti'
import { sfx } from '../lib/sfx'
import { CARD_KNOWN } from '../store/profile'
import { DAILY_GOAL, dayKey, lastDays, liveStreak, mastery, toUnlock } from '../store/progress'
import { useStore } from '../store/store'
import { suggestedSkill } from './Practice'

const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'narrow' })
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/** The warm-up is always quick enough to do in your head: two-step if that is open, one-step if not. */
const warmUpSkill = (): SkillId =>
  useStore.getState().profile.unlocked.includes(SKILL_ORDER[1]) ? SKILL_ORDER[1] : SKILL_ORDER[0]

const newWarmUp = (avoid: string[] = []): Question =>
  makeQuestion(generateProblem(warmUpSkill(), Math.random, avoid), 'choice')

/** One question, straight away, so the first thing anyone does here is find x. */
function WarmUp() {
  const answer = useStore((s) => s.answer)
  const go = useStore((s) => s.go)
  const [question, setQuestion] = useState(() => newWarmUp())
  const [chosen, setChosen] = useState<number | null>(null)
  const [xp, setXp] = useState(0)
  const startedAt = useRef(performance.now())
  const equationEl = useRef<HTMLDivElement>(null)

  const { problem } = question
  const answered = chosen !== null
  const right = answered && question.numbers![chosen] === problem.solution

  const choose = (i: number) => {
    if (answered) return
    const correct = question.numbers![i] === problem.solution
    const out = answer({
      skill: problem.skill,
      correct,
      hintsUsed: 0,
      ms: performance.now() - startedAt.current,
    })
    setChosen(i)
    setXp(out.xp)
    if (correct) {
      sfx.right()
      burstFrom(equationEl.current, 50)
    } else {
      sfx.wrong()
    }
  }

  const another = () => {
    setQuestion(newWarmUp([problem.id]))
    setChosen(null)
    startedAt.current = performance.now()
    sfx.tap()
  }

  const mood: Mood = !answered ? 'idle' : right ? 'happy' : 'oops'
  const speech = !answered
    ? 'Warm-up. Which value of x makes this true?'
    : right
      ? `That is it. Put ${fmtNum(problem.solution)} in for x and both sides match.`
      : `Not this time. It is x = ${fmtNum(problem.solution)}. Put that in and both sides match.`

  return (
    <section className="flex min-w-0 flex-1 flex-col" aria-label="Warm-up question">
      <div className="flex items-start gap-4">
        <Coach mood={mood} className="h-32 w-32 shrink-0" />
        <motion.div
          key={speech}
          className="mt-3"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Bubble className="!text-xl">
            <p aria-live="polite">
              <Rich text={speech} />
            </p>
          </Bubble>
        </motion.div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-10 pb-4">
        <motion.div
          key={problem.id}
          ref={equationEl}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          <Maths eq={problem.equation} className="text-8xl" />
        </motion.div>

        <div className="flex gap-4">
          {question.numbers!.map((n, i) => {
            const correct = n === problem.solution
            const tone = !answered ? '' : correct ? 'key-tick' : chosen === i ? 'key-cross' : 'opacity-45'
            return (
              <button
                key={`${problem.id}:${n}`}
                type="button"
                onClick={() => choose(i)}
                data-down={answered && chosen === i}
                className={`key key-lg maths min-w-36 !text-4xl ${tone} ${answered ? 'pointer-events-none' : ''}`}
                style={
                  answered && (correct || chosen === i)
                    ? { ['--x-colour' as string]: 'var(--color-white)' }
                    : undefined
                }
              >
                <span>
                  <X /> = {fmtNum(n)}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex h-14 items-center gap-4">
          {answered && (
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              {right && (
                <span className="font-display text-2xl font-bold">
                  <span className="marked">+{xp} XP</span>
                </span>
              )}
              <button type="button" className="key" onClick={another}>
                Try another one
              </button>
              <button
                type="button"
                className="key key-primary"
                onClick={() => go('practice', suggestedSkill())}
              >
                Start a round
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}

/** Today's XP against the daily goal, and which of the last seven days were active. */
function Today() {
  const daily = useStore((s) => s.profile.daily)
  const streak = useStore((s) => liveStreak(s.profile.streak, s.profile.lastActive, dayKey()))
  const today = dayKey()
  const earned = daily[today] ?? 0
  const reached = earned >= DAILY_GOAL
  const week = lastDays(today, 7)

  return (
    <section className="panel flex items-center gap-6 p-6" aria-label="Today">
      <Ring
        value={(earned / DAILY_GOAL) * 100}
        colour={reached ? 'var(--color-tick)' : 'var(--color-cobalt)'}
        track={reached ? 'var(--color-tick-pale)' : 'var(--color-white)'}
        outlined={false}
        thickness={12}
        label={`${earned} of ${DAILY_GOAL} XP earned today`}
        className="h-28 w-28 shrink-0"
      >
        <span className="font-display text-3xl font-black">{earned}</span>
      </Ring>
      <div className="min-w-0">
        <h2 className="text-2xl">
          {reached ? 'Daily goal reached' : `${DAILY_GOAL - earned} XP to today's goal`}
        </h2>
        <p className="mt-1 text-base">
          {streak === 0
            ? 'Earn any XP today to start a streak.'
            : earned > 0
              ? `${plural(streak, 'day')} in a row, today included.`
              : `${plural(streak, 'day')} in a row. Earn XP today to keep it going.`}
        </p>
        <ol className="mt-3 flex gap-2" aria-label="The last seven days">
          {week.map((key) => {
            const active = (daily[key] ?? 0) > 0
            const [y, m, d] = key.split('-').map(Number)
            const letter = weekday.format(new Date(y, m - 1, d))
            return (
              <li key={key} className="flex flex-col items-center gap-1">
                <span
                  className={`h-5 w-5 rounded-full ${active ? 'bg-cobalt' : 'bg-white'} ${
                    key === today ? 'ring-2 ring-ink ring-offset-2 ring-offset-sky' : ''
                  }`}
                  aria-label={`${key === today ? 'Today' : letter}: ${active ? 'active' : 'no XP'}`}
                />
                <span className="text-xs leading-none" aria-hidden>
                  {letter}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

function NextRow({
  icon: Icon,
  tone,
  title,
  line,
  onClick,
}: {
  icon: LucideIcon
  tone: string
  title: string
  line: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="key w-full !justify-start !gap-4 !px-4 !py-3.5 text-left"
    >
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-ink ${tone}`}>
        <Icon className="h-6 w-6" strokeWidth={2.4} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-xl">{title}</span>
        <span className="mt-1 block font-body text-base leading-snug font-normal">
          <Rich text={line} />
        </span>
      </span>
    </button>
  )
}

/** The three places to go from here, each with the one thing most worth doing there. */
function NextUp() {
  const profile = useStore((s) => s.profile)
  const go = useStore((s) => s.go)

  const labNext = LAB_PRESETS.findIndex((lab) => !profile.labSolved.includes(lab.id))
  const labLine =
    labNext === -1
      ? 'All six challenges solved. Try a random equation on the scale.'
      : labNext === 0
        ? 'See why you do the same thing to both sides of an equation.'
        : `Challenge ${labNext + 1} of ${LAB_PRESETS.length} is waiting on the scale.`

  const skill = suggestedSkill()
  const info = skillInfo(skill)
  const after = SKILLS[SKILL_ORDER.indexOf(skill) + 1]
  const stats = profile.skills[skill]
  const practiceLine =
    after && !profile.unlocked.includes(after.id)
      ? `${plural(toUnlock(stats), 'more right answer')} in ${info.name} opens ${after.name}.`
      : `${info.name} is ${mastery(stats)}% mastered. A round is 5 questions.`

  const known = FLASHCARDS.filter((card) => profile.cards[card.id] === CARD_KNOWN).length
  const cardsLine =
    known === FLASHCARDS.length
      ? 'Every card is known. Flip through them to stay sharp.'
      : known === 0
        ? `${FLASHCARDS.length} cards on the words and rules of algebra.`
        : `${plural(FLASHCARDS.length - known, 'card')} still to learn out of ${FLASHCARDS.length}.`

  return (
    <section aria-label="Where to go next">
      <h2 className="text-2xl">{profile.xp === 0 ? 'Where to start' : 'Pick up where you left off'}</h2>
      <div className="mt-4 flex flex-col gap-4">
        <NextRow icon={Scale} tone="bg-hi" title="Balance Lab" line={labLine} onClick={() => go('lab')} />
        <NextRow
          icon={Target}
          tone="bg-box text-white"
          title="Practice"
          line={practiceLine}
          onClick={() => go('practice', skill)}
        />
        <NextRow
          icon={Layers}
          tone="bg-tick text-white"
          title="Flashcards"
          line={cardsLine}
          onClick={() => go('cards')}
        />
      </div>
    </section>
  )
}

export function Home() {
  return (
    <div className="flex h-full gap-10">
      <WarmUp />
      <div className="flex w-[26rem] shrink-0 flex-col gap-7">
        <Today />
        <NextUp />
      </div>
    </div>
  )
}
