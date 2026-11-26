import { MOVES, RARITY, type MoveCard, type MoveId, type Rarity } from '../content/moves'
import type { Rng } from '../engine/rng'

export const PACK_SIZE = 3

/** Card id to how many copies are owned. Missing means not found yet. */
export type Album = Partial<Record<MoveId, number>>

/** How likely each card is to turn up, next to the others. */
const WEIGHT: Record<Rarity, number> = { common: 6, rare: 3, holo: 1 }

export const copiesOf = (album: Album, id: MoveId): number => album[id] ?? 0

export const foundCount = (album: Album): number =>
  MOVES.filter((card) => copiesOf(album, card.id) > 0).length

export const albumComplete = (album: Album): boolean => foundCount(album) === MOVES.length

function weighted(rng: Rng, pool: MoveCard[]): MoveCard {
  const total = pool.reduce((sum, card) => sum + WEIGHT[card.rarity], 0)
  let roll = rng() * total
  for (const card of pool) {
    roll -= WEIGHT[card.rarity]
    if (roll < 0) return card
  }
  return pool[pool.length - 1]
}

/**
 * Three different cards. While any card is still missing, one of the three is
 * always new, so the album fills in twelve packs at most. They come back with
 * the rarest last, which is the order they are turned over.
 */
export function drawPack(album: Album, rng: Rng): MoveId[] {
  const picked: MoveCard[] = []
  const missing = MOVES.filter((card) => copiesOf(album, card.id) === 0)
  if (missing.length > 0) picked.push(weighted(rng, missing))
  while (picked.length < PACK_SIZE) {
    picked.push(
      weighted(
        rng,
        MOVES.filter((card) => !picked.includes(card)),
      ),
    )
  }
  return picked
    .sort((a, b) => RARITY[a.rarity].rank - RARITY[b.rarity].rank || MOVES.indexOf(a) - MOVES.indexOf(b))
    .map((card) => card.id)
}
