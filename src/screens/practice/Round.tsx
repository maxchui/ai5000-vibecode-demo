import { Check, Delete, Flame, Lightbulb, X as Cross } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Bubble, Coach, type Mood } from '../../components/Coach'
import { Maths } from '../../components/Maths'
import { Rich, X } from '../../components/X'
import { fmtNum } from '../../engine/format'
import { generateProblem, skillInfo } from '../../engine/generate'
import { makeQuestion, type Question, type QuestionKind } from '../../engine/questions'
import type { SkillId } from '../../engine/types'
import { burstFrom } from '../../lib/confetti'
import { sfx } from '../../lib/sfx'
import { mastery } from '../../store/progress'
import { useStore } from '../../store/store'
import { Steps } from './Steps'

export const ROUND_LENGTH = 5

/** The three kinds of question take turns, so no two in a row feel the same. */
const KINDS: QuestionKind[] = ['type', 'choice', 'next-step', 'type', 'next-step']

const PRAISE = ['Spot on.', 'Yes, that is it.', 'Exactly right.', 'Nailed it.', 'You found it.']

export interface RoundSummary {
  results: boolean[]
  xp: number
  masteryBefore: number
}

function newQuestion(skill: SkillId, index: number, avoid: string[]): Question {
  return makeQuestion(generateProblem(skill, Math.random, avoid), KINDS[index % KINDS.length])
}

/** "−4", "-4" and " 4 " are all fine. Anything else is not an answer yet. */
function readNumber(text: string): number | null {
  const tidy = text.trim().replace('−', '-')
  return /^-?\d{1,4}$/.test(tidy) ? Number(tidy) : null
}

const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'sign', '0', 'back'] as const

export function Round({
  skill,
  onDone,
  onLeave,
}: {
  skill: SkillId
  onDone: (summary: RoundSummary) => void
  onLeave: () => void
}) {
  const answer = useStore((s) => s.answer)
  const combo = useStore((s) => s.profile.combo)
  const celebrating = useStore((s) => s.celebrations.length > 0)
  const info = skillInfo(skill)

  const [index, setIndex] = useState(0)
  const [question, setQuestion] = useState(() => newQuestion(skill, 0, []))
  const [status, setStatus] = useState<'asking' | 'right' | 'wrong'>('asking')
  const [typed, setTyped] = useState('')
  const [chosen, setChosen] = useState<number | null>(null)
  const [hints, setHints] = useState(0)
  const [showSteps, setShowSteps] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const [earned, setEarned] = useState(0)
  const [lastXp, setLastXp] = useState(0)
  const [praise, setPraise] = useState(PRAISE[0])
  const [refused, setRefused] = useState(false)

  const seen = useRef<string[]>([question.problem.id])
  const startedAt = useRef(performance.now())
  const masteryBefore = useRef(mastery(useStore.getState().profile.skills[skill]))
  const equationEl = useRef<HTMLDivElement>(null)
  const inputEl = useRef<HTMLInputElement>(null)

  const { problem } = question
  const asking = status === 'asking'
  const lastQuestion = index + 1 >= ROUND_LENGTH

  const settle = (correct: boolean) => {
    const out = answer({ skill, correct, hintsUsed: hints, ms: performance.now() - startedAt.current })
    setStatus(correct ? 'right' : 'wrong')
    setResults((r) => [...r, correct])
    setEarned((e) => e + out.xp)
    setLastXp(out.xp)
    if (correct) {
      setPraise(PRAISE[Math.floor(Math.random() * PRAISE.length)])
      sfx.right()
      burstFrom(equationEl.current, 45)
    } else {
      // A wrong move is explained on the buttons themselves, so they stay on screen.
      if (question.kind !== 'next-step') setShowSteps(true)
      sfx.wrong()
    }
  }

  const checkTyped = () => {
    const value = readNumber(typed)
    if (value === null) {
      setRefused(true)
      window.setTimeout(() => setRefused(false), 420)
      inputEl.current?.focus()
      return
    }
    settle(value === problem.solution)
  }

  const choose = (i: number, correct: boolean) => {
    if (!asking) return
    setChosen(i)
    settle(correct)
  }

  const next = () => {
    if (lastQuestion) {
      onDone({ results, xp: earned, masteryBefore: masteryBefore.current })
      return
    }
    const upcoming = newQuestion(skill, index + 1, seen.current)
    seen.current.push(upcoming.problem.id)
    setIndex(index + 1)
    setQuestion(upcoming)
    setStatus('asking')
    setTyped('')
    setChosen(null)
    setHints(0)
    setShowSteps(false)
    startedAt.current = performance.now()
    sfx.tap()
  }

  // Enter moves on once a question has been answered. While a celebration is up, Enter belongs to it.
  const nextRef = useRef(next)
  nextRef.current = next
  useEffect(() => {
    if (asking || celebrating) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      e.preventDefault()
      nextRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [asking, celebrating])

  // Number keys always reach the answer box, even if a click has moved the focus somewhere else.
  useEffect(() => {
    if (!asking || celebrating || question.kind !== 'type') return
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement === inputEl.current || e.metaKey || e.ctrlKey || e.altKey) return
      if (!/^\d$/.test(e.key) && e.key !== '-') return
      e.preventDefault()
      setTyped((t) => (t.length >= 5 ? t : `${t}${e.key}`))
      inputEl.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [asking, celebrating, question.kind])

  const press = (key: (typeof KEYS)[number]) => {
    sfx.tap()
    setTyped((t) => {
      if (key === 'back') return t.slice(0, -1)
      if (key === 'sign') return t.startsWith('−') || t.startsWith('-') ? t.slice(1) : `−${t}`
      return t.length >= 5 ? t : `${t}${key}`
    })
    inputEl.current?.focus()
  }

  const prompt =
    question.kind === 'type'
      ? 'Find x. Type your answer.'
      : question.kind === 'choice'
        ? 'Which value of x makes this true?'
        : 'Here is where the working has got to. What is a good next step?'

  let mood: Mood = hints > 0 ? 'think' : 'idle'
  let speech = hints > 0 ? question.hints[hints - 1] : prompt
  if (status === 'right') {
    mood = combo >= 3 ? 'cheer' : 'happy'
    speech = combo >= 3 ? `${praise} That is ${combo} in a row.` : praise
  } else if (status === 'wrong') {
    mood = 'oops'
    speech =
      question.kind === 'next-step'
        ? 'Not quite. The green move is the one that helps. Each one says why.'
        : 'Not quite. Follow the steps to see how it works out.'
  }

  const rightMove = question.moves?.find((m) => m.correct)

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex shrink-0 items-center gap-5">
        <button type="button" className="link -ml-2" onClick={onLeave}>
          <Cross className="h-5 w-5" strokeWidth={3} aria-hidden />
          Leave round
        </button>
        <p className="font-display text-xl font-bold">
          <Rich text={info.name} />
        </p>

        <ol
          className="ml-auto flex items-center gap-2"
          aria-label={`Question ${index + 1} of ${ROUND_LENGTH}`}
        >
          {Array.from({ length: ROUND_LENGTH }, (_, i) => {
            const result = results[i]
            const current = i === index && result === undefined
            return (
              <li
                key={i}
                className={`grid h-9 w-9 place-items-center rounded-full border-2 border-ink font-display font-black text-white ${
                  result === true ? 'bg-tick' : result === false ? 'bg-cross' : current ? 'bg-hi' : 'bg-white'
                }`}
              >
                {result === true && <Check className="h-5 w-5" strokeWidth={3.6} aria-label="right" />}
                {result === false && <Cross className="h-5 w-5" strokeWidth={3.6} aria-label="wrong" />}
              </li>
            )
          })}
        </ol>

        <div
          className="flex w-36 items-center justify-end gap-1.5 font-display text-lg font-bold"
          aria-live="polite"
        >
          {combo >= 2 && (
            <motion.span
              key={combo}
              className="flex items-center gap-1.5"
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            >
              <Flame className="h-6 w-6" strokeWidth={2.4} fill="var(--color-box)" aria-hidden />
              {combo} in a row
            </motion.span>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-8">
        <div className="flex w-[19rem] shrink-0 flex-col items-center justify-center gap-4 pb-2">
          <div className="flex h-[10.5rem] w-full items-end">
            <motion.div
              key={speech}
              className="w-full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Bubble tail="bottom">
                {asking && hints > 0 && (
                  <p className="mb-1 font-display text-base font-bold">
                    Hint {hints} of {question.hints.length}
                  </p>
                )}
                <p aria-live="polite">
                  <Rich text={speech} />
                </p>
              </Bubble>
            </motion.div>
          </div>
          <Coach mood={mood} className="h-44 w-44" />
          <button
            type="button"
            className="key key-sm key-hi"
            disabled={!asking || hints >= question.hints.length}
            onClick={() => {
              setHints(hints + 1)
              sfx.flip()
            }}
          >
            <Lightbulb className="h-5 w-5" strokeWidth={2.4} aria-hidden />
            {hints === 0
              ? 'Show a hint'
              : hints >= question.hints.length
                ? 'No more hints'
                : 'Show another hint'}
          </button>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                className="flex min-h-full flex-col items-center justify-center gap-8 py-2"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.2 }}
              >
                {/* The worked steps begin with the question, so the big copy steps aside for them. */}
                {!showSteps && (
                  <div ref={equationEl}>
                    <Maths eq={question.shown} className="text-7xl" />
                  </div>
                )}

                {showSteps ? (
                  <Steps problem={problem} />
                ) : question.kind === 'type' ? (
                  <form
                    className="flex items-center gap-8"
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (asking) checkTyped()
                    }}
                  >
                    <div className="flex flex-col items-center gap-5">
                      <label className="maths flex items-center gap-4 text-5xl">
                        <span>
                          <X /> =
                        </span>
                        <input
                          ref={inputEl}
                          autoFocus
                          value={typed}
                          onChange={(e) => setTyped(e.target.value.replace(/[^\d−-]/g, '').slice(0, 5))}
                          readOnly={!asking}
                          inputMode="numeric"
                          autoComplete="off"
                          aria-label="Your answer for x"
                          className={`w-44 rounded-2xl border-2 border-ink px-4 py-3 text-center ${
                            status === 'right'
                              ? 'bg-tick-pale'
                              : status === 'wrong'
                                ? 'bg-cross-pale'
                                : 'bg-white'
                          } ${refused ? 'animate-shake' : ''}`}
                        />
                      </label>
                      <button type="submit" className="key key-primary key-lg" disabled={!asking}>
                        Check answer
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2" aria-label="Number pad">
                      {KEYS.map((key) => (
                        <button
                          key={key}
                          type="button"
                          disabled={!asking}
                          onClick={() => press(key)}
                          aria-label={key === 'sign' ? 'Plus or minus' : key === 'back' ? 'Delete' : key}
                          className="key key-sm h-12 w-14 !px-0 !text-xl"
                        >
                          {key === 'sign' ? (
                            '±'
                          ) : key === 'back' ? (
                            <Delete className="h-5 w-5" strokeWidth={2.6} />
                          ) : (
                            key
                          )}
                        </button>
                      ))}
                    </div>
                  </form>
                ) : question.kind === 'choice' ? (
                  <div className="grid grid-cols-2 gap-4">
                    {question.numbers!.map((n, i) => {
                      const correct = n === problem.solution
                      const tone = asking
                        ? ''
                        : correct
                          ? 'key-tick'
                          : chosen === i
                            ? 'key-cross'
                            : 'opacity-45'
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => choose(i, correct)}
                          data-down={!asking && chosen === i}
                          className={`key key-lg maths min-w-52 !text-4xl ${tone} ${asking ? '' : 'pointer-events-none'}`}
                          style={
                            !asking && (correct || chosen === i)
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
                ) : (
                  <div className="grid w-full max-w-[46rem] grid-cols-2 gap-4">
                    {question.moves!.map((move, i) => {
                      const picked = chosen === i
                      const reveal = !asking && (move.correct || picked)
                      const tone = asking
                        ? ''
                        : move.correct
                          ? 'key-tick'
                          : picked
                            ? 'key-cross'
                            : 'opacity-45'
                      return (
                        <button
                          key={move.label}
                          type="button"
                          onClick={() => choose(i, move.correct)}
                          data-down={!asking && picked}
                          className={`key min-h-20 flex-col !gap-1.5 ${tone} ${asking ? '' : 'pointer-events-none'}`}
                          style={reveal ? { ['--x-colour' as string]: 'var(--color-white)' } : undefined}
                        >
                          <span>
                            <Rich text={move.label} />
                          </span>
                          {reveal && (
                            <span className="font-body text-sm leading-snug font-normal">
                              <Rich text={move.why} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="h-[4.75rem] shrink-0">
            <AnimatePresence>
              {!asking && (
                <motion.div
                  className={`flex h-full items-center gap-4 rounded-2xl border-2 px-5 ${
                    status === 'right' ? 'border-tick bg-tick-pale' : 'border-cross bg-cross-pale'
                  }`}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                >
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-ink text-white ${
                      status === 'right' ? 'bg-tick' : 'bg-cross'
                    }`}
                  >
                    {status === 'right' ? (
                      <Check className="h-6 w-6" strokeWidth={3.6} aria-hidden />
                    ) : (
                      <Cross className="h-6 w-6" strokeWidth={3.6} aria-hidden />
                    )}
                  </span>
                  <p className="font-display text-2xl font-bold" role="status">
                    {status === 'right' ? (
                      <>
                        Correct <span className="marked ml-2">+{lastXp} XP</span>
                      </>
                    ) : question.kind === 'next-step' && rightMove ? (
                      <Rich text={`Not quite. ${rightMove.label}.`} />
                    ) : (
                      <Rich text={`Not quite. The answer is x = ${fmtNum(problem.solution)}.`} />
                    )}
                  </p>
                  <button type="button" className="link ml-auto" onClick={() => setShowSteps(!showSteps)}>
                    {showSteps ? 'Hide the steps' : 'See the steps'}
                  </button>
                  <button type="button" className="key key-primary" onClick={next}>
                    {lastQuestion ? 'Finish round' : 'Next question'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
