import { LockOpen } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { skillInfo } from '../engine/generate'
import { shower } from '../lib/confetti'
import { sfx } from '../lib/sfx'
import { badgeInfo } from '../store/badges'
import { useStore, type Celebration } from '../store/store'
import { BadgeIcon } from './BadgeIcon'
import { Coach } from './Coach'
import { Maths } from './Maths'
import { Rich } from './X'

function Body({ item }: { item: Celebration }) {
  switch (item.kind) {
    case 'level':
      return (
        <>
          <Coach mood="cheer" className="mx-auto h-36 w-36" />
          <p className="mt-5 text-lg">You levelled up</p>
          <h2 className="mt-1 text-6xl font-black">Level {item.level}</h2>
          <p className="mt-4 font-display text-2xl font-bold">
            <span className="marked">{item.title}</span>
          </p>
        </>
      )
    case 'badges': {
      if (item.badges.length === 1) {
        const badge = badgeInfo(item.badges[0])
        return (
          <>
            <motion.div
              className="mx-auto h-36 w-36"
              initial={{ rotate: -200, scale: 0.2 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 150, damping: 13 }}
            >
              <BadgeIcon id={badge.id} className="h-full w-full" />
            </motion.div>
            <p className="mt-5 text-lg">You earned a badge</p>
            <h2 className="mt-1 text-5xl font-black">{badge.name}</h2>
            <p className="mt-3 text-lg">{badge.how}</p>
          </>
        )
      }
      return (
        <>
          <h2 className="text-4xl font-black">You earned {item.badges.length} badges</h2>
          <ul className="mt-7 flex justify-center gap-6">
            {item.badges.map((id, i) => {
              const badge = badgeInfo(id)
              return (
                <motion.li
                  key={id}
                  className="flex w-36 flex-col items-center"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 190, damping: 13, delay: 0.15 + i * 0.18 }}
                >
                  <BadgeIcon id={id} className="h-24 w-24" />
                  <p className="mt-3 font-display text-xl leading-tight font-bold">{badge.name}</p>
                  <p className="mt-1 text-sm leading-snug">{badge.how}</p>
                </motion.li>
              )
            })}
          </ul>
        </>
      )
    }
    case 'unlock': {
      const skill = skillInfo(item.skill)
      return (
        <>
          <motion.div
            className="mx-auto grid h-28 w-28 place-items-center rounded-full border-2 border-ink bg-hi shadow-doodle"
            initial={{ scale: 0.3 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 11 }}
          >
            <LockOpen className="h-14 w-14" strokeWidth={2.4} aria-hidden />
          </motion.div>
          <p className="mt-5 text-lg">You unlocked a new skill</p>
          <h2 className="mt-1 text-5xl font-black">
            <Rich text={skill.name} />
          </h2>
          <p className="mt-5">
            <Maths eq={skill.example} className="text-4xl" />
          </p>
        </>
      )
    }
  }
}

/**
 * Level-ups, badges and unlocks take over the screen one at a time. They leave
 * at once when dismissed, with no fade, so the screen underneath can be clicked
 * straight away.
 */
export function Celebrations() {
  const queued = useStore((s) => s.celebrations[0])
  const dismissQueued = useStore((s) => s.dismissCelebration)
  const [shownKey, setShownKey] = useState<number | null>(null)
  const lastDismissed = useRef(0)
  const queuedKey = queued?.key

  // Wait a beat before taking over the screen, so the thing that earned the
  // celebration (the right answer, the box opening) gets seen first.
  useEffect(() => {
    if (queuedKey === undefined) return
    const justDismissed = performance.now() - lastDismissed.current < 700
    const timer = window.setTimeout(() => setShownKey(queuedKey), justDismissed ? 280 : 1150)
    return () => window.clearTimeout(timer)
  }, [queuedKey])

  const item = queued && queued.key === shownKey ? queued : null
  const key = item?.key

  useEffect(() => {
    if (key === undefined) return
    sfx.cheer()
    shower()
  }, [key])

  const dismiss = () => {
    lastDismissed.current = performance.now()
    dismissQueued()
  }

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          key={item.key}
          className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
          onClick={dismiss}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="sheet w-fit max-w-full min-w-[32rem] px-10 pt-8 pb-9 text-center"
            initial={{ scale: 0.6, rotate: -5, y: 40 }}
            animate={{ scale: 1, rotate: 0, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Body item={item} />
            <button type="button" autoFocus onClick={dismiss} className="key key-primary key-lg mt-8">
              Keep going
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
