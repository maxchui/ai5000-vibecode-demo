import { Star } from 'lucide-react'
import { moveInfo, moveNumber, MOVES, RARITY, type MoveId, type Rarity } from '../content/moves'
import { fmtEq } from '../engine/format'
import { skillInfo } from '../engine/generate'
import { useTilt, type TiltMode } from '../lib/tilt'
import { Maths } from './Maths'
import { MoveArt } from './MoveArt'
import { Rich, X } from './X'

/** One, two or three stars: common, rare, holo. */
export function Stars({ rarity, className = '' }: { rarity: Rarity; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 gap-[0.08em] ${className}`} aria-hidden>
      {Array.from({ length: RARITY[rarity].stars }, (_, i) => (
        <Star
          key={i}
          className="h-[1em] w-[1em]"
          strokeWidth={2.6}
          fill="var(--color-hi)"
          color="var(--color-ink)"
        />
      ))}
    </span>
  )
}

/** Everything on the card as one sentence, for anyone who cannot see it. */
export function describeMove(id: MoveId): string {
  const card = moveInfo(id)
  const working = card.working.map((line) => (typeof line === 'string' ? line : fmtEq(line))).join(', then ')
  return `${card.name}. ${RARITY[card.rarity].label} card, number ${moveNumber(id)} of ${MOVES.length}. ${card.rule} For example: ${working}.`
}

/**
 * A move card. It is sized in em, so the font size of whatever holds it sets
 * how big the whole card is: `text-[1.4rem]` for a card to look at, a third of
 * that for a thumbnail.
 */
export function MoveCard({
  id,
  tilt = 'still',
  phase = 0,
  className = '',
}: {
  id: MoveId
  tilt?: TiltMode
  /** Shifts the swaying, so cards side by side do not rock in step. */
  phase?: number
  className?: string
}) {
  const card = moveInfo(id)
  const ref = useTilt<HTMLDivElement>(tilt, phase)
  const last = card.working.length - 1

  return (
    <div ref={ref} className={`mcard-tilt ${className}`} role="img" aria-label={describeMove(id)}>
      <div className="mcard" data-rarity={card.rarity}>
        <div className="mcard-face">
          <div className="mcard-head">
            <span className="mcard-name">
              <Rich text={card.name} />
            </span>
            <Stars rarity={card.rarity} />
          </div>

          <div className="mcard-art">
            <MoveArt id={id} layer="back" />
            {card.rarity === 'rare' && <span className="mcard-foil" />}
            <MoveArt id={id} layer="scene" />
          </div>

          <div className="mcard-panel">
            <p className="mcard-rule">
              <Rich text={card.rule} />
            </p>
            <div className="mcard-working">
              {card.working.map((line, i) => (
                <span key={i} className={i === last ? 'marked' : undefined}>
                  {typeof line === 'string' ? (
                    <span className="maths">
                      <Rich text={line} />
                    </span>
                  ) : (
                    <Maths eq={line} />
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="mcard-foot">
            <span>
              {moveNumber(id)} of {MOVES.length}
            </span>
            <span>{card.skill ? <Rich text={skillInfo(card.skill).name} /> : 'Every equation'}</span>
          </div>

          {card.rarity === 'holo' && (
            <>
              <span className="mcard-foil" />
              <span className="mcard-glitter" />
            </>
          )}
          <span className="mcard-glare" />
        </div>
      </div>
    </div>
  )
}

/** The back of a card, and what a card looks like before it is turned over. */
export function CardBack({ className = '' }: { className?: string }) {
  return (
    <div className={`mcard-tilt ${className}`} aria-hidden>
      <div className="mcard">
        <div className="mcard-back">
          <span className="mcard-emblem">
            <X />
          </span>
        </div>
      </div>
    </div>
  )
}
