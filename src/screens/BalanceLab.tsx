import { Check, Dices, Undo2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bubble, Coach, type Mood } from '../components/Coach'
import { Maths, MathsSide } from '../components/Maths'
import { Rich } from '../components/X'
import {
  applyMove,
  isSolved,
  LAB_PRESETS,
  labEquation,
  moveNote,
  optionsFor,
  randomLab,
  repairFor,
  type LabMove,
  type LabOption,
  type LabState,
} from '../engine/lab'
import { mulberry32, shuffle } from '../engine/rng'
import type { Equation } from '../engine/types'
import { burstFrom } from '../lib/confetti'
import { sfx } from '../lib/sfx'
import { useStore } from '../store/store'
import { Scale } from './lab/Scale'

/** One line of working: the equation, and what was done to get there. */
interface Line {
  eq: Equation
  note?: string
}

interface Say {
  text: string
  mood: Mood
}

const INTRO: Say = {
  text: 'The scale is level. Every box hides the same number. Get one box on its own to find out what it is.',
  mood: 'idle',
}

const firstUnsolved = (solved: string[]) => {
  const i = LAB_PRESETS.findIndex((lab) => !solved.includes(lab.id))
  return i === -1 ? 0 : i
}

const count = (n: number, what: 'units' | 'boxes') =>
  what === 'units' ? `${n} ${n === 1 ? 'weight' : 'weights'}` : `${n} ${n === 1 ? 'box' : 'boxes'}`

export function BalanceLab() {
  const solvedIds = useStore((s) => s.profile.labSolved)
  const solveLab = useStore((s) => s.solveLab)

  /** Which set challenge is on the scale, or null for a random equation. */
  const [pick, setPick] = useState<number | null>(() => firstUnsolved(useStore.getState().profile.labSolved))
  const [state, setState] = useState<LabState>(() => LAB_PRESETS[pick ?? 0])
  const [lines, setLines] = useState<Line[]>(() => [{ eq: labEquation(state) }])
  /** Set after a one-sided move, until it is repaired or undone. */
  const [tipped, setTipped] = useState<{ move: LabMove; before: LabState } | null>(null)
  const [groups, setGroups] = useState<number | null>(null)
  const [solved, setSolved] = useState(false)
  const [award, setAward] = useState<{ xp: number; first: boolean } | null>(null)
  const [say, setSay] = useState<Say>(INTRO)
  const [round, setRound] = useState(0)
  const [nudge, setNudge] = useState(0)
  const [refused, setRefused] = useState<string | null>(null)

  const stage = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => clearTimers, [])

  const load = (next: LabState, index: number | null) => {
    clearTimers()
    setPick(index)
    setState(next)
    setLines([{ eq: labEquation(next) }])
    setTipped(null)
    setGroups(null)
    setSolved(false)
    setAward(null)
    setSay(INTRO)
    setRound((r) => r + 1)
    sfx.drop()
  }

  /** Let the last move settle, then open the box. */
  const finish = (final: LabState) => {
    later(() => {
      setSolved(true)
      setAward(solveLab(pick === null ? null : LAB_PRESETS[pick].id))
      setSay({ text: `One box balances ${count(final.x, 'units')}, so x = ${final.x}.`, mood: 'cheer' })
      sfx.reveal()
      burstFrom(stage.current, 80)
    }, 700)
  }

  const land = (next: LabState, note: string, text: string) => {
    setState(next)
    setLines((ls) => [...ls, { eq: labEquation(next), note }])
    setSay({ text, mood: 'happy' })
    sfx.pop()
    if (isSolved(next)) finish(next)
  }

  const waiting = groups !== null || (isSolved(state) && !solved)

  const choose = (option: LabOption) => {
    if (waiting) return
    if (option.outcome === 'blocked') {
      sfx.wrong()
      setSay({ text: option.say, mood: 'think' })
      setRefused(option.id)
      later(() => setRefused(null), 450)
      return
    }
    if (option.outcome === 'tips') {
      setTipped({ move: option.move, before: state })
      setState(applyMove(state, option.move))
      setSay({ text: option.say, mood: 'oops' })
      sfx.tip()
      return
    }
    if (option.move.type === 'share') {
      // Deal everything into groups first, so the sharing can be seen, then keep one group.
      setGroups(option.move.n)
      setSay({ text: `Sharing both sides into ${option.move.n} equal groups.`, mood: 'think' })
      sfx.share()
      later(() => {
        setGroups(null)
        land(applyMove(state, option.move), moveNote(option.move), option.say)
      }, 1500)
      return
    }
    setNudge((n) => n + 1)
    land(applyMove(state, option.move), moveNote(option.move), option.say)
  }

  const repair = tipped ? repairFor(state, tipped.move) : null
  const taken = tipped && tipped.move.type === 'take' ? tipped.move : null

  const doRepair = () => {
    if (!taken || !repair) return
    setTipped(null)
    land(
      applyMove(state, repair),
      moveNote({ ...taken, where: 'both' }),
      'Level again. Both sides have now lost the same amount.',
    )
  }

  const undo = () => {
    if (!tipped) return
    setState(tipped.before)
    setTipped(null)
    setSay({ text: 'Back to level. Try a move that treats both sides the same.', mood: 'idle' })
    sfx.drop()
  }

  // The same choices always appear in the same order for a given position, but the right one is not always first.
  const options = useMemo(
    () => shuffle(mulberry32(round * 97 + lines.length * 13 + state.x), optionsFor(state)),
    [state, round, lines.length],
  )

  const equation = labEquation(state)
  const nextPreset = LAB_PRESETS.findIndex((lab) => !solvedIds.includes(lab.id))

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex shrink-0 items-center gap-2.5">
        {LAB_PRESETS.map((lab, i) => {
          const done = solvedIds.includes(lab.id)
          const current = pick === i
          return (
            <button
              key={lab.id}
              type="button"
              onClick={() => load(lab, i)}
              aria-current={current ? 'true' : undefined}
              aria-label={`Challenge ${i + 1}: ${lab.title}${done ? ' (solved)' : ''}`}
              title={lab.title}
              className={`grid h-11 w-11 place-items-center rounded-full border-2 border-ink font-display text-lg font-black transition-transform ${
                current
                  ? 'scale-110 bg-ink text-white'
                  : done
                    ? 'bg-tick text-white'
                    : 'bg-white hover:bg-sky'
              }`}
            >
              {done && !current ? <Check className="h-5 w-5" strokeWidth={3.4} aria-hidden /> : i + 1}
            </button>
          )
        })}
        <p className="ml-3 font-display text-xl font-bold">
          {pick === null ? 'A random equation' : `Challenge ${pick + 1}: ${LAB_PRESETS[pick].title}`}
        </p>
        <button type="button" className="key key-sm ml-auto" onClick={() => load(randomLab(), null)}>
          <Dices className="h-5 w-5" strokeWidth={2.4} aria-hidden />
          Random equation
        </button>
      </div>

      <div className="flex min-h-0 flex-1 gap-8">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 text-center" aria-live="polite">
            <span className={`maths text-5xl ${tipped ? 'animate-shake inline-block' : ''}`}>
              <MathsSide side={equation.left} />
              <span className={`mx-[0.3em] ${tipped ? 'text-cross' : ''}`}>{tipped ? '≠' : '='}</span>
              <MathsSide side={equation.right} />
            </span>
          </div>

          <div ref={stage} className="min-h-0 flex-1 py-1">
            <Scale key={round} state={state} groups={groups} solved={solved} nudge={nudge} />
          </div>

          <div className="flex shrink-0 items-start gap-4">
            <Coach mood={say.mood} className="h-24 w-24 shrink-0" />
            <motion.div
              key={say.text}
              className="flex-1"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Bubble className="min-h-[5.2rem]">
                <p aria-live="polite">
                  <Rich text={say.text} />
                </p>
              </Bubble>
            </motion.div>
          </div>
        </div>

        <div className="flex w-[23rem] shrink-0 flex-col gap-5">
          <section className="panel flex min-h-0 flex-1 flex-col p-6">
            <h2 className="text-2xl">Steps</h2>
            <p className="mt-1 text-base leading-snug">
              Each move is one line of working. The note beside it is what was done to both sides.
            </p>
            <ol className="mt-5 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
              {lines.map((line, i) => {
                const last = i === lines.length - 1
                return (
                  <motion.li
                    key={`${round}-${i}`}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Maths eq={line.eq} className={`text-3xl ${last && !tipped ? 'marked' : ''}`} />
                    {last && solved && (
                      <Check className="h-8 w-8 shrink-0 text-tick" strokeWidth={3.6} aria-label="solved" />
                    )}
                    {line.note && (
                      <span className="chip ml-auto shrink-0 border-2 border-ink bg-white text-base">
                        <Rich text={line.note} />
                      </span>
                    )}
                  </motion.li>
                )
              })}
              {tipped && (
                <motion.li
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border-2 border-cross bg-cross-pale px-3 py-2 font-display text-lg font-bold text-cross"
                >
                  Tipped. The two sides are not equal any more.
                </motion.li>
              )}
            </ol>
          </section>

          <section className="shrink-0" aria-label="Your move">
            {solved && award ? (
              <div className="flex flex-col gap-3">
                <p className="font-display text-xl font-bold">
                  <span className="marked">+{award.xp} XP</span>
                  <span className="ml-3 font-body text-base font-normal">
                    {award.first ? 'Challenge solved for the first time.' : 'Solved.'}
                  </span>
                </p>
                {nextPreset !== -1 && (
                  <button
                    type="button"
                    autoFocus
                    className="key key-primary w-full"
                    onClick={() => load(LAB_PRESETS[nextPreset], nextPreset)}
                  >
                    Go to challenge {nextPreset + 1}
                  </button>
                )}
                <button
                  type="button"
                  className={`key w-full ${nextPreset === -1 ? 'key-primary' : ''}`}
                  onClick={() => load(randomLab(), null)}
                >
                  <Dices className="h-5 w-5" strokeWidth={2.4} aria-hidden />
                  Try a random equation
                </button>
              </div>
            ) : tipped && taken ? (
              <div className="flex flex-col gap-3">
                {repair && (
                  <button type="button" className="key key-primary w-full" onClick={doRepair}>
                    Take {count(taken.n, taken.what)} off the {taken.where === 'left' ? 'right' : 'left'} side
                    too
                  </button>
                )}
                <button type="button" className="key w-full" onClick={undo}>
                  <Undo2 className="h-5 w-5" strokeWidth={2.6} aria-hidden />
                  Put {taken.n === 1 ? 'it' : 'them'} back
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <h2 className="text-xl">What will you do?</h2>
                {options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    disabled={waiting}
                    onClick={() => choose(option)}
                    className={`key w-full ${refused === option.id ? 'animate-shake' : ''}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
