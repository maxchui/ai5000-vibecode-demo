import { Lock, Star } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { BadgeIcon } from '../components/BadgeIcon'
import { Rich } from '../components/X'
import { SKILLS } from '../engine/generate'
import { BADGES } from '../store/badges'
import { DAILY_GOAL, dayKey, lastDays, mastery, MASTERED_AT, WINDOW } from '../store/progress'
import { useStore } from '../store/store'

const DAYS = 14

const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'narrow' })
const fullDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })

const asDate = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-7 first:pl-0">
      <p className="font-display text-5xl leading-none font-black">{value}</p>
      <p className="mt-2 text-base">{label}</p>
    </div>
  )
}

/**
 * XP earned on each of the last 14 days. One series, so one colour and no
 * legend. Every column can be hovered or tabbed to for its exact value, and the
 * same numbers sit in a table for screen readers.
 */
function XpChart({ daily, today }: { daily: Record<string, number>; today: string }) {
  const [active, setActive] = useState<number | null>(null)
  const [asTable, setAsTable] = useState(false)
  const days = lastDays(today, DAYS).map((key) => ({ key, xp: daily[key] ?? 0, date: asDate(key) }))
  const peak = Math.max(...days.map((d) => d.xp))
  const top = Math.max(100, Math.ceil(Math.max(peak, DAILY_GOAL) / 50) * 50)
  const ticks = Array.from({ length: top / 50 + 1 }, (_, i) => i * 50)
  const peakIndex = days.findIndex((d) => d.xp === peak)
  const at = (xp: number) => `${(xp / top) * 100}%`

  return (
    <figure className="flex min-h-0 flex-1 flex-col">
      <figcaption className="flex items-baseline gap-4">
        <h2 className="text-2xl">XP each day</h2>
        <p className="text-base">Last {DAYS} days</p>
        <button type="button" className="link -my-1 ml-auto text-sm" onClick={() => setAsTable(!asTable)}>
          {asTable ? 'Show as a chart' : 'Show as a table'}
        </button>
      </figcaption>

      {asTable ? (
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <table className="w-full text-left text-base">
            <thead>
              <tr className="border-b border-mist font-display">
                <th scope="col" className="py-1 font-bold">
                  Day
                </th>
                <th scope="col" className="py-1 text-right font-bold">
                  XP
                </th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day.key} className="border-b border-mist last:border-0">
                  <th scope="row" className="py-1 font-normal">
                    {day.key === today ? 'Today' : fullDate.format(day.date)}
                  </th>
                  <td className="tabular py-1 text-right font-display font-bold">{day.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="mt-4 flex min-h-0 flex-1 gap-3">
            <div className="tabular relative w-8 text-right text-sm" aria-hidden>
              {ticks.map((t) => (
                <span
                  key={t}
                  className="absolute right-0 translate-y-1/2 leading-none"
                  style={{ bottom: at(t) }}
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="relative flex-1">
              {ticks.map((t) => (
                <div key={t} className="absolute inset-x-0 h-px bg-mist" style={{ bottom: at(t) }} />
              ))}

              {/* The daily goal is a threshold, not a gridline, so it is the one dashed line. */}
              <div
                className="absolute inset-x-0 border-t-2 border-dashed border-ink"
                style={{ bottom: at(DAILY_GOAL) }}
              />

              {peak === 0 && (
                <p className="absolute inset-x-0 top-[18%] text-center text-lg">
                  No XP yet. Answer a question and the first bar goes up here.
                </p>
              )}

              <div className="absolute inset-0 flex">
                {days.map((day, i) => {
                  const isToday = day.key === today
                  const lit = active === i
                  return (
                    <div
                      key={day.key}
                      className="relative flex flex-1 items-end justify-center -outline-offset-2"
                      role="img"
                      aria-label={`${isToday ? 'Today' : fullDate.format(day.date)}: ${day.xp} XP`}
                      tabIndex={0}
                      onPointerEnter={() => setActive(i)}
                      onPointerLeave={() => setActive(null)}
                      onFocus={() => setActive(i)}
                      onBlur={() => setActive(null)}
                    >
                      {lit && <div className="absolute inset-0 bg-white/70" />}
                      <motion.div
                        className={`relative w-[1.3rem] max-w-[60%] rounded-t-[0.28rem] ${lit ? 'bg-ink' : 'bg-cobalt'}`}
                        initial={{ height: 0 }}
                        animate={{ height: at(day.xp) }}
                        transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.15 + i * 0.035 }}
                      >
                        {!lit && ((i === peakIndex && day.xp > 0) || (isToday && day.xp > 0)) && (
                          <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 font-display text-sm leading-none font-bold whitespace-nowrap">
                            {day.xp}
                          </span>
                        )}
                      </motion.div>

                      {lit && (
                        <div
                          className={`pointer-events-none absolute z-10 rounded-lg border-2 border-ink bg-white px-3 py-1.5 text-left whitespace-nowrap shadow-doodle-sm ${
                            i < 2 ? 'left-0' : i > DAYS - 3 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                          }`}
                          style={{ bottom: `calc(${at(day.xp)} + 0.45rem)` }}
                          aria-hidden
                        >
                          <p className="font-display text-lg leading-tight font-black">{day.xp} XP</p>
                          <p className="text-sm">{isToday ? 'Today' : fullDate.format(day.date)}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="relative w-[4.2rem] text-sm leading-tight" aria-hidden>
              <span className="absolute left-0 translate-y-1/2" style={{ bottom: at(DAILY_GOAL) }}>
                Daily goal
              </span>
            </div>
          </div>

          <div className="mt-2 flex gap-3" aria-hidden>
            <div className="w-8" />
            <div className="flex flex-1">
              {days.map((day) => (
                <span
                  key={day.key}
                  className={`flex-1 text-center text-sm leading-none ${day.key === today ? 'font-display font-black' : ''}`}
                >
                  {day.key === today ? 'Today' : weekday.format(day.date)}
                </span>
              ))}
            </div>
            <div className="w-[4.2rem]" />
          </div>
        </>
      )}
    </figure>
  )
}

function Skills() {
  const skills = useStore((s) => s.profile.skills)
  const unlocked = useStore((s) => s.profile.unlocked)
  return (
    <section className="flex min-h-0 flex-col">
      <h2 className="text-2xl">Skills</h2>
      <ul className="mt-4 flex flex-1 flex-col justify-between gap-2">
        {SKILLS.map((skill, i) => {
          const stats = skills[skill.id]
          const open = unlocked.includes(skill.id)
          const percent = mastery(stats)
          const mastered = percent >= MASTERED_AT
          const right = stats.recent.filter(Boolean).length
          return (
            <li key={skill.id} className="grid grid-cols-[11.5rem_1fr_3rem] items-center gap-x-4">
              <span className={`font-display text-lg leading-tight font-bold ${open ? '' : 'opacity-55'}`}>
                <Rich text={skill.name} />
              </span>
              {/* A meter: the empty track is a lighter step of the fill, so the whole bar reads as one thing. */}
              <span
                className={`block h-3 overflow-hidden rounded-full ${mastered ? 'bg-tick-pale' : 'bg-white'}`}
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-label={`${skill.name} mastery`}
              >
                <motion.span
                  className={`block h-full rounded-full ${mastered ? 'bg-tick' : 'bg-cobalt'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.2 + i * 0.08 }}
                />
              </span>
              <span className="tabular text-right font-display text-lg font-black">
                {open ? `${percent}%` : ''}
              </span>
              <span className="col-span-3 mt-0.5 flex items-center gap-1.5 text-sm">
                {!open ? (
                  <>
                    <Lock className="h-4 w-4" strokeWidth={2.6} aria-hidden />
                    Locked
                  </>
                ) : mastered ? (
                  <>
                    <Star className="h-4 w-4" strokeWidth={2.4} fill="var(--color-hi)" aria-hidden />
                    Mastered
                  </>
                ) : stats.attempts === 0 ? (
                  'Not started'
                ) : (
                  `${right} right in the last ${Math.min(stats.attempts, WINDOW)}`
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Badges() {
  const earned = useStore((s) => s.profile.badges)
  const [active, setActive] = useState<string | null>(null)
  const count = BADGES.filter((b) => earned[b.id]).length
  return (
    <section className="shrink-0">
      <div className="flex items-baseline gap-4">
        <h2 className="text-2xl">Badges</h2>
        <p className="text-base">
          {count} of {BADGES.length} earned. Point at one to see how to earn it.
        </p>
      </div>
      <ul className="mt-4 grid grid-cols-12 gap-2">
        {BADGES.map((badge, i) => {
          const date = earned[badge.id]
          const lit = active === badge.id
          return (
            <motion.li
              key={badge.id}
              className="relative flex flex-col items-center rounded-xl text-center outline-offset-4"
              tabIndex={0}
              onPointerEnter={() => setActive(badge.id)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(badge.id)}
              onBlur={() => setActive(null)}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 17, delay: 0.25 + i * 0.045 }}
            >
              <BadgeIcon id={badge.id} earned={Boolean(date)} className="h-[4.1rem] w-[4.1rem]" />
              <p className={`mt-2 font-display text-sm leading-tight font-bold ${date ? '' : 'opacity-60'}`}>
                {badge.name}
              </p>
              <span className="sr-only">
                {date ? `Earned ${shortDate.format(asDate(date))}.` : 'Not earned yet.'} {badge.how}.
              </span>
              {lit && (
                <div
                  className={`pointer-events-none absolute bottom-full z-10 mb-2 w-max max-w-[15rem] rounded-lg border-2 border-ink bg-white px-3 py-2 text-left shadow-doodle-sm ${
                    i < 2 ? 'left-0' : i > BADGES.length - 3 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                  }`}
                  aria-hidden
                >
                  <p className="font-display text-base leading-tight font-bold">{badge.how}</p>
                  <p className="mt-0.5 text-sm">
                    {date ? `Earned ${shortDate.format(asDate(date))}` : 'Not earned yet'}
                  </p>
                </div>
              )}
            </motion.li>
          )
        })}
      </ul>
    </section>
  )
}

export function Progress() {
  const profile = useStore((s) => s.profile)
  const today = dayKey()
  const accuracy = profile.answered === 0 ? 0 : Math.round((profile.correct / profile.answered) * 100)

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex shrink-0 divide-x-2 divide-mist">
        <Stat value={profile.xp.toLocaleString('en-GB')} label="XP in total" />
        <Stat value={`${profile.answered}`} label="questions answered" />
        <Stat value={`${accuracy}%`} label="answered correctly" />
        <Stat value={`${profile.bestCombo}`} label="right in a row, at best" />
        <Stat value={`${profile.labSolved.length} of 6`} label="Balance Lab challenges solved" />
      </div>

      <div className="flex min-h-0 flex-1 gap-6">
        <div className="panel flex min-w-0 flex-[1.25] flex-col p-6">
          <XpChart daily={profile.daily} today={today} />
        </div>
        <div className="panel flex min-w-0 flex-1 flex-col p-6">
          <Skills />
        </div>
      </div>

      <Badges />
    </div>
  )
}
