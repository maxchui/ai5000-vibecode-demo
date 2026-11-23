import { Flame } from 'lucide-react'
import { animate, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { dayKey, levelInfo, liveStreak } from '../store/progress'
import { useStore } from '../store/store'

/** A number that rolls up to its new value instead of jumping. */
export function useCountUp(value: number): number {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    if (from.current === value) return
    const controls = animate(from.current, value, {
      duration: 0.7,
      ease: 'easeOut',
      onUpdate: (v) => setShown(Math.round(v)),
    })
    from.current = value
    return () => controls.stop()
  }, [value])
  return shown
}

/** Streak, level and XP: always in the top corner, like the score in a game. */
export function Hud() {
  const xp = useStore((s) => s.profile.xp)
  const streak = useStore((s) => liveStreak(s.profile.streak, s.profile.lastActive, dayKey()))
  const gain = useStore((s) => s.lastGain)
  const info = levelInfo(xp)
  const into = useCountUp(info.into)

  return (
    <div className="flex items-center gap-7">
      <div className="flex items-center gap-2" aria-label={`${streak} day streak`}>
        <Flame
          className="h-9 w-9"
          strokeWidth={2.2}
          fill={streak > 0 ? 'var(--color-box)' : 'var(--color-white)'}
          aria-hidden
        />
        <div className="leading-none">
          <div className="tabular font-display text-2xl font-black">{streak}</div>
          <div className="mt-0.5 text-sm">day streak</div>
        </div>
      </div>

      <div className="relative flex items-center gap-3" aria-label={`Level ${info.level}, ${info.title}`}>
        <motion.div
          key={info.level}
          initial={{ scale: 1.5, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 12 }}
          className="tabular grid h-12 w-12 place-items-center rounded-full border-2 border-ink bg-hi font-display text-2xl font-black shadow-doodle-sm"
        >
          {info.level}
        </motion.div>
        <div className="w-56">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-lg leading-tight font-bold">{info.title}</span>
            <span className="tabular text-sm whitespace-nowrap">
              {into} / {info.span} XP
            </span>
          </div>
          <div className="mt-1 h-4 overflow-hidden rounded-full border-2 border-ink bg-white">
            <motion.div
              className="h-full bg-cobalt"
              initial={false}
              animate={{ width: `${(info.into / info.span) * 100}%` }}
              transition={{ type: 'spring', stiffness: 90, damping: 18 }}
            />
          </div>
        </div>
        {gain && (
          <span
            key={gain.key}
            className="animate-float-up chip pointer-events-none absolute top-full right-0 mt-1 border-2 border-ink bg-hi text-base"
          >
            +{gain.amount} XP
          </span>
        )}
      </div>
    </div>
  )
}
