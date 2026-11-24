import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { moveInfo, MOVES, RARITY } from '../content/moves'
import { burstFrom, shower } from '../lib/confetti'
import { sfx } from '../lib/sfx'
import { useStore, type Reveal } from '../store/store'
import { CardBack, MoveCard } from './MoveCard'
import { Pack } from './Pack'

const CARD_SIZE = 'text-[1.15rem]'

/** A card that starts face down and turns over once. Only one side is ever on screen, so the turn needs no 3D trickery. */
function Turning({ up, children }: { up: boolean; children: React.ReactNode }) {
  return (
    <div className="[perspective:60rem]">
      <AnimatePresence mode="wait" initial={false}>
        {up ? (
          <motion.div
            key="front"
            initial={{ rotateY: -90, scale: 1.08 }}
            animate={{ rotateY: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 17 }}
          >
            {children}
          </motion.div>
        ) : (
          <motion.div
            key="back"
            exit={{ rotateY: 90, scale: 1.08 }}
            transition={{ duration: 0.15, ease: 'easeIn' }}
          >
            <CardBack className={CARD_SIZE} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Opening({ reveal }: { reveal: Reveal }) {
  const { pulls } = reveal
  const packs = useStore((s) => s.profile.packs)
  const tab = useStore((s) => s.tab)
  const openPack = useStore((s) => s.openPack)
  const closeReveal = useStore((s) => s.closeReveal)
  const go = useStore((s) => s.go)

  const [stage, setStage] = useState<'sealed' | 'torn' | 'dealt'>('sealed')
  /** How many of the cards are face up. */
  const [turned, setTurned] = useState(0)
  const cardEls = useRef<(HTMLLIElement | null)[]>([])
  const done = turned === pulls.length

  const tear = () => {
    if (stage !== 'sealed') return
    setStage('torn')
    sfx.rip()
  }

  useEffect(() => {
    if (stage !== 'torn') return
    const timer = window.setTimeout(() => setStage('dealt'), 520)
    return () => window.clearTimeout(timer)
  }, [stage])

  // The cards turn over one at a time, rarest last, and the last one is made to wait.
  useEffect(() => {
    if (stage !== 'dealt' || turned >= pulls.length) return
    const wait = turned === 0 ? 750 : turned === pulls.length - 1 ? 1150 : 750
    const timer = window.setTimeout(() => setTurned((n) => n + 1), wait)
    return () => window.clearTimeout(timer)
  }, [stage, turned, pulls.length])

  useEffect(() => {
    if (turned === 0) return
    const rarity = moveInfo(pulls[turned - 1].id).rarity
    if (rarity === 'holo') {
      sfx.shine()
      burstFrom(cardEls.current[turned - 1], 110)
    } else if (rarity === 'rare') {
      sfx.reveal()
    } else {
      sfx.flip()
    }
  }, [turned, pulls])

  useEffect(() => {
    if (!done || !reveal.completed) return
    const timer = window.setTimeout(() => {
      sfx.cheer()
      shower()
    }, 700)
    return () => window.clearTimeout(timer)
  }, [done, reveal.completed])

  const fresh = pulls.filter((pull) => pull.isNew).length
  const heading = !done
    ? stage === 'sealed'
      ? 'A pack of 3 move cards'
      : 'What is inside?'
    : reveal.completed
      ? `Collection complete. All ${MOVES.length} cards found.`
      : fresh === 0
        ? 'No new cards this time'
        : fresh === 1
          ? '1 new card for your collection'
          : `${fresh} new cards for your collection`

  return (
    <div
      className="stage fixed inset-0 z-[45] flex flex-col items-center justify-center gap-7 p-8 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Opening a pack of cards"
    >
      <h2 className="text-5xl font-black" aria-live="polite">
        {heading}
      </h2>

      <div className="flex h-[28.5rem] items-center justify-center">
        {stage !== 'dealt' ? (
          <div className="flex flex-col items-center gap-6">
            <button
              type="button"
              autoFocus
              onClick={tear}
              aria-label="Open the pack"
              className={`rounded-xl outline-offset-8 focus-visible:outline-hi ${stage === 'sealed' ? 'animate-bob' : ''}`}
            >
              <Pack torn={stage === 'torn'} className="h-[21rem]" />
            </button>
            <p className={`text-xl ${stage === 'sealed' ? '' : 'invisible'}`}>Click the pack to open it.</p>
          </div>
        ) : (
          <ul className="flex gap-10">
            {pulls.map((pull, i) => {
              const card = moveInfo(pull.id)
              const up = i < turned
              return (
                <motion.li
                  key={i}
                  ref={(el) => {
                    cardEls.current[i] = el
                  }}
                  className="flex flex-col items-center gap-5"
                  initial={{ y: 90, scale: 0.5, opacity: 0, rotate: (i - 1) * 14 }}
                  animate={{ y: 0, scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 230, damping: 19, delay: i * 0.09 }}
                >
                  <Turning up={up}>
                    <MoveCard id={pull.id} tilt="sway" phase={i * 1.7} className={CARD_SIZE} />
                  </Turning>
                  <p
                    className={`flex h-8 items-center gap-3 font-display text-lg font-bold ${up ? '' : 'invisible'}`}
                  >
                    {pull.isNew && (
                      <span className="chip border-2 border-ink bg-hi text-base text-ink">New</span>
                    )}
                    <span>
                      {pull.isNew
                        ? `${RARITY[card.rarity].label} card`
                        : `You now have ${pull.copies} of these`}
                    </span>
                  </p>
                </motion.li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="flex h-14 items-center gap-4">
        {done && (
          <>
            <button type="button" autoFocus className="key key-primary key-lg" onClick={closeReveal}>
              Keep going
            </button>
            {packs > 0 && (
              <button type="button" className="key key-hi key-lg" onClick={openPack}>
                Open another pack
              </button>
            )}
            {tab !== 'collection' && (
              <button
                type="button"
                className="key key-lg"
                onClick={() => {
                  closeReveal()
                  go('collection')
                }}
              >
                See the collection
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Opening a pack takes over the screen: the wrapper tears, three cards come
 * out face down, and they turn over one by one. By the time this is shown the
 * cards are already in the album, so nothing is lost if the page is closed.
 */
export function PackReveal() {
  const reveal = useStore((s) => s.reveal)
  return reveal ? <Opening key={reveal.key} reveal={reveal} /> : null
}
