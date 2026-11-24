import { Star } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Bubble, Coach, type Mood } from '../components/Coach'
import { MoveCard, Stars } from '../components/MoveCard'
import { Pack } from '../components/Pack'
import { moveInfo, moveNumber, MOVES, RARITY, type MoveId, type Rarity } from '../content/moves'
import { sfx } from '../lib/sfx'
import { copiesOf, foundCount, type Album } from '../store/packs'
import { useStore } from '../store/store'
import { suggestedSkill } from './Practice'

/** The card to show off first: the rarest one found, and the latest of those. */
function best(album: Album): MoveId {
  const found = MOVES.filter((card) => copiesOf(album, card.id) > 0)
  if (found.length === 0) return MOVES[0].id
  return found.reduce((top, card) => (RARITY[card.rarity].rank >= RARITY[top.rarity].rank ? card : top)).id
}

/** The stars of a card that has not been found: outlines only. */
function EmptyStars({ rarity, colour }: { rarity: Rarity; colour: string }) {
  return (
    <span className="inline-flex gap-[0.08em]" aria-hidden>
      {Array.from({ length: RARITY[rarity].stars }, (_, i) => (
        <Star key={i} className="h-[1em] w-[1em]" strokeWidth={2.6} color={colour} />
      ))}
    </span>
  )
}

function Thumb({
  id,
  copies,
  selected,
  onSelect,
}: {
  id: MoveId
  copies: number
  selected: boolean
  onSelect: () => void
}) {
  const card = moveInfo(id)
  const n = moveNumber(id)
  return (
    <li className="[container-type:inline-size]">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={
          copies > 0
            ? `${card.name}, ${RARITY[card.rarity].label.toLowerCase()} card, ${copies === 1 ? '1 copy' : `${copies} copies`}`
            : `Card ${n}, not found yet`
        }
        className={`relative block w-full rounded-[5.4cqw] transition-transform duration-150 hover:-translate-y-1 ${
          selected ? 'outline-[0.28rem] outline-offset-[0.22rem] outline-hi-deep' : ''
        }`}
      >
        {copies > 0 ? (
          <MoveCard id={id} className="pointer-events-none !w-full text-[6.667cqw]" />
        ) : (
          <span className="flex aspect-[5/7] w-full flex-col items-center justify-center gap-1 rounded-[5.4cqw] border-2 border-dashed border-mist bg-white/70 text-mist">
            <span className="font-display text-4xl leading-none font-black">{n}</span>
            <span className="text-base">
              <EmptyStars rarity={card.rarity} colour="var(--color-mist)" />
            </span>
          </span>
        )}
        {copies > 1 && (
          <span className="chip absolute -top-2 -right-2 z-10 border-2 border-ink bg-hi">×{copies}</span>
        )}
      </button>
    </li>
  )
}

export function Collection() {
  const album = useStore((s) => s.profile.album)
  const packs = useStore((s) => s.profile.packs)
  const reveal = useStore((s) => s.reveal)
  const openPack = useStore((s) => s.openPack)
  const go = useStore((s) => s.go)

  const [selected, setSelected] = useState<MoveId>(() => best(useStore.getState().profile.album))

  // A pack has just been opened: put its best card on show.
  useEffect(() => {
    if (reveal) setSelected(reveal.pulls[reveal.pulls.length - 1].id)
  }, [reveal])

  const found = foundCount(album)
  const complete = found === MOVES.length
  const card = moveInfo(selected)
  const owned = copiesOf(album, selected) > 0

  const mood: Mood = complete ? 'cheer' : packs > 0 ? 'happy' : 'idle'
  const speech = complete
    ? `All ${MOVES.length} cards found. You know every move in the book.`
    : packs > 0
      ? 'You have a pack to open. Three cards are inside.'
      : found === 0
        ? 'Every card is a move for solving equations. Finish a Practice round to earn a pack of three.'
        : 'Every card is a move for solving equations. Finish a Practice round to earn another pack.'

  return (
    <div className="flex h-full items-stretch justify-center gap-7">
      <div className="flex w-[13.5rem] shrink-0 flex-col items-center justify-center gap-4">
        <Bubble tail="bottom" className="w-full">
          <p aria-live="polite">{speech}</p>
        </Bubble>
        <Coach mood={mood} className="h-36 w-36" />

        <div className="mt-3 flex min-h-[15.5rem] w-full flex-col items-center justify-end gap-4">
          {packs > 0 ? (
            <>
              <div className="relative animate-bob">
                <Pack className="h-44" />
                {packs > 1 && (
                  <span className="chip absolute -top-2 -right-4 border-2 border-ink bg-hi text-base">
                    ×{packs}
                  </span>
                )}
              </div>
              <button type="button" className="key key-primary w-full" onClick={openPack}>
                Open the pack
              </button>
            </>
          ) : (
            <>
              <div className="grid h-44 w-[8.2rem] place-items-center rounded-xl border-2 border-dashed border-mist px-3 text-center text-base leading-snug">
                No packs to open
              </div>
              <button type="button" className="key w-full" onClick={() => go('practice', suggestedSkill())}>
                Start a round
              </button>
            </>
          )}
        </div>
      </div>

      <div className="stage flex w-[25rem] shrink-0 flex-col items-center justify-center gap-6 rounded-[1.4rem] py-6 text-white">
        {owned ? (
          <motion.div
            key={selected}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <MoveCard id={selected} tilt="sway" className="text-[1.4rem]" />
          </motion.div>
        ) : (
          <div className="flex aspect-[5/7] w-[21rem] flex-col items-center justify-center gap-3 rounded-[1.1rem] border-2 border-dashed border-white/45 text-center">
            <p className="font-display text-8xl leading-none font-black text-white/45">?</p>
            <p className="font-display text-2xl font-bold">
              Card {moveNumber(selected)} of {MOVES.length}
            </p>
            <p className="flex items-center gap-2 text-lg">
              <EmptyStars rarity={card.rarity} colour="var(--color-hi)" />
              {RARITY[card.rarity].label} card, not found yet
            </p>
          </div>
        )}
        <p className="text-base">
          {owned ? 'Point at the card to tilt it.' : 'Finish a Practice round to earn a pack.'}
        </p>
      </div>

      <section className="flex min-w-0 flex-1 flex-col justify-center" aria-label="Your album">
        <div className="flex items-baseline gap-4">
          <h2 className="text-2xl">Your album</h2>
          <p className="text-base">
            {found} of {MOVES.length} cards found
          </p>
        </div>

        <ul className="mt-5 grid grid-cols-4 gap-x-3.5 gap-y-4">
          {MOVES.map((move) => (
            <Thumb
              key={move.id}
              id={move.id}
              copies={copiesOf(album, move.id)}
              selected={move.id === selected}
              onSelect={() => {
                if (move.id !== selected) sfx.tap()
                setSelected(move.id)
              }}
            />
          ))}
        </ul>

        <ul className="mt-5 flex gap-6 text-sm">
          {(Object.keys(RARITY) as Rarity[]).map((rarity) => (
            <li key={rarity} className="flex items-center gap-1.5">
              <Stars rarity={rarity} className="text-base" />
              {RARITY[rarity].label}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
