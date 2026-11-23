import { Check, RotateCcw } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Bubble, Coach, type Mood } from '../components/Coach'
import { Rich } from '../components/X'
import { FLASHCARDS, type Flashcard } from '../content/flashcards'
import { sfx } from '../lib/sfx'
import { CARD_KNOWN, CARD_LEARNING } from '../store/profile'
import { useStore } from '../store/store'

type Piles = Record<string, number>

const pileOf = (cards: Piles, id: string) => cards[id] ?? 0

/** Cards not seen yet come first, then the ones still being learned, then the known ones. */
function buildQueue(cards: Piles, skipKnown = false): string[] {
  return FLASHCARDS.filter((c) => !skipKnown || pileOf(cards, c.id) !== CARD_KNOWN)
    .map((c, i) => ({ id: c.id, pile: pileOf(cards, c.id), i }))
    .sort((a, b) => a.pile - b.pile || a.i - b.i)
    .map((c) => c.id)
}

const face =
  'absolute inset-0 flex flex-col rounded-[0.7rem] px-10 py-8 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]'

function Card({ card, flipped, onFlip }: { card: Flashcard; flipped: boolean; onFlip: () => void }) {
  return (
    <button
      type="button"
      onClick={onFlip}
      aria-label={
        flipped ? `Answer: ${card.back}` : `Card: ${card.front.replace('\n', ' ')}. Flip to see the answer.`
      }
      className="block h-full w-full rounded-[0.7rem] text-left [perspective:1400px]"
    >
      <motion.span
        className="sheet relative block h-full w-full [transform-style:preserve-3d]"
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 170, damping: 19 }}
        // Turned over, the card is mirrored, so its drawn shadow has to be mirrored back.
        style={{ boxShadow: `${flipped ? '-' : ''}0.28rem 0.28rem 0 var(--color-ink)` }}
      >
        <span className={`${face} bg-white`}>
          <span className="chip self-start border-2 border-ink bg-sky text-base">{card.group}</span>
          <span
            className={`my-auto block text-center font-display leading-tight font-black whitespace-pre-line ${
              card.frontIsMaths ? 'text-5xl' : 'text-6xl'
            }`}
          >
            <Rich text={card.front} />
          </span>
          <span className="block text-center text-base">
            {card.group === 'Spot the mistake'
              ? 'Work out what went wrong, then flip the card.'
              : 'Say what it means, then flip the card.'}
          </span>
        </span>

        <span className={`${face} bg-hi [transform:rotateY(180deg)]`}>
          <span className="block font-display text-xl font-bold">
            <Rich text={card.frontIsMaths ? card.group : card.front} />
          </span>
          <span className="my-auto block text-[1.75rem] leading-snug">
            <Rich text={card.back} />
          </span>
          {card.example && (
            <span className="block rounded-xl border-2 border-ink bg-white px-5 py-3 font-display text-xl font-bold">
              <Rich text={card.example} />
            </span>
          )}
        </span>
      </motion.span>
    </button>
  )
}

function Pile({ count, label, tone }: { count: number; label: string; tone: string }) {
  return (
    <li className="flex items-center gap-4">
      <span
        className={`tabular grid h-14 w-11 shrink-0 place-items-center rounded-lg border-2 border-ink font-display text-2xl font-black shadow-doodle-sm ${tone}`}
      >
        {count}
      </span>
      <span className="text-lg leading-tight">{label}</span>
    </li>
  )
}

export function Flashcards() {
  const cards = useStore((s) => s.profile.cards)
  const rateCard = useStore((s) => s.rateCard)
  const celebrating = useStore((s) => s.celebrations.length > 0)

  const [queue, setQueue] = useState(() => buildQueue(useStore.getState().profile.cards))
  const [total, setTotal] = useState(queue.length)
  const [flipped, setFlipped] = useState(false)
  /** Which way the last card left: 1 to the known pile, −1 back into the deck. */
  const [direction, setDirection] = useState(1)
  const [tally, setTally] = useState({ known: 0, learning: 0 })
  const [say, setSay] = useState<{ text: string; mood: Mood }>({
    text: 'Say the answer in your head first. Then flip the card and see if you were right.',
    mood: 'idle',
  })

  const current = FLASHCARDS.find((c) => c.id === queue[0])
  const done = total - queue.length

  const known = FLASHCARDS.filter((c) => pileOf(cards, c.id) === CARD_KNOWN).length
  const learning = FLASHCARDS.filter((c) => pileOf(cards, c.id) === CARD_LEARNING).length
  const unseen = FLASHCARDS.length - known - learning

  const flip = () => {
    if (!current) return
    setFlipped((f) => !f)
    sfx.flip()
  }

  const rate = (knowIt: boolean) => {
    if (!current || !flipped) return
    const { xp } = rateCard(current.id, knowIt)
    setDirection(knowIt ? 1 : -1)
    setTally((t) => (knowIt ? { ...t, known: t.known + 1 } : { ...t, learning: t.learning + 1 }))
    setQueue((q) => q.slice(1))
    setFlipped(false)
    if (knowIt) {
      sfx.right()
      setSay({ text: xp > 0 ? 'Into the known pile. That is 3 XP.' : 'Still known. Good.', mood: 'happy' })
    } else {
      sfx.drop()
      setSay({ text: 'No problem. That one will come round again.', mood: 'think' })
    }
  }

  const restart = (skipKnown: boolean) => {
    const next = buildQueue(useStore.getState().profile.cards, skipKnown)
    setQueue(next)
    setTotal(next.length)
    setFlipped(false)
    setTally({ known: 0, learning: 0 })
    setSay({ text: 'Here we go again. Say the answer first, then flip.', mood: 'idle' })
    sfx.pop()
  }

  // Space flips, the arrow keys sort. The latest handlers are kept in a ref so the listener is set up once.
  const keys = useRef({ flip, rate })
  keys.current = { flip, rate }
  useEffect(() => {
    if (celebrating) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        keys.current.flip()
      } else if (e.key === 'ArrowRight') keys.current.rate(true)
      else if (e.key === 'ArrowLeft') keys.current.rate(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [celebrating])

  return (
    <div className="flex h-full items-center justify-center gap-9">
      <div className="flex w-[13rem] shrink-0 flex-col gap-6">
        <ul className="flex flex-col gap-4">
          <Pile count={unseen} label="not seen yet" tone="bg-white" />
          <Pile count={learning} label="still learning" tone="bg-box-pale" />
          <Pile count={known} label="known" tone="bg-tick-pale" />
        </ul>
        <button type="button" className="key key-sm self-start" onClick={() => restart(false)}>
          <RotateCcw className="h-5 w-5" strokeWidth={2.6} aria-hidden />
          Start the deck again
        </button>
      </div>

      <div className="flex w-[35rem] shrink-0 flex-col items-center">
        <div className="relative h-[22rem] w-full">
          {/* The rest of the deck, peeking out from underneath. */}
          {queue.length > 2 && (
            <div className="sheet absolute inset-0 translate-x-3 translate-y-3 rotate-[2.2deg] !shadow-none" />
          )}
          {queue.length > 1 && (
            <div className="sheet absolute inset-0 translate-x-1.5 translate-y-1.5 -rotate-[1.2deg] !shadow-none" />
          )}

          <AnimatePresence custom={direction}>
            {current ? (
              <motion.div
                key={`${current.id}-${total}-${done}`}
                className="absolute inset-0"
                custom={direction}
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, x: 0, rotate: 0 }}
                exit="leave"
                variants={{
                  leave: (dir: number) => ({
                    x: dir * 560,
                    rotate: dir * 16,
                    opacity: 0,
                    transition: { duration: 0.32, ease: 'easeIn' },
                  }),
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              >
                <Card card={current} flipped={flipped} onFlip={flip} />
              </motion.div>
            ) : (
              <motion.div
                key="finished"
                className="sheet absolute inset-0 flex flex-col items-center justify-center px-10 text-center"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <h2 className="text-5xl font-black">Deck finished</h2>
                <p className="mt-4 text-xl">
                  {tally.known} sorted as known, {tally.learning} to see again.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  {known < FLASHCARDS.length && (
                    <button type="button" autoFocus className="key key-primary" onClick={() => restart(true)}>
                      Go again with the {FLASHCARDS.length - known} still to learn
                    </button>
                  )}
                  <button type="button" className="key" onClick={() => restart(false)}>
                    Go through every card
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-9 flex w-full items-center gap-4">
          <button
            type="button"
            className="key flex-1"
            disabled={!current || !flipped}
            onClick={(e) => {
              e.currentTarget.blur()
              rate(false)
            }}
          >
            Still learning
          </button>
          <button
            type="button"
            className="key key-tick flex-1"
            disabled={!current || !flipped}
            onClick={(e) => {
              e.currentTarget.blur()
              rate(true)
            }}
          >
            <Check className="h-5 w-5" strokeWidth={3.4} aria-hidden />I know it
          </button>
        </div>

        <div className="mt-6 w-full">
          <div
            className="h-3 overflow-hidden rounded-full border-2 border-ink bg-white"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
            aria-label="Cards sorted"
          >
            <motion.div
              className="h-full bg-cobalt"
              initial={false}
              animate={{ width: `${total === 0 ? 100 : (done / total) * 100}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
          <p className="mt-2 flex justify-between text-sm">
            <span>
              {done} of {total} sorted
            </span>
            <span>Space flips the card. The arrow keys sort it.</span>
          </p>
        </div>
      </div>

      <div className="flex w-[15rem] shrink-0 flex-col items-center gap-4">
        <motion.div
          key={say.text}
          className="w-full"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Bubble tail="bottom">
            <p aria-live="polite">{say.text}</p>
          </Bubble>
        </motion.div>
        <Coach mood={say.mood} className="h-44 w-44" />
      </div>
    </div>
  )
}
