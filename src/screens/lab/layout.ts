import type { Pan } from '../../engine/lab'

/** Where a token stands on a pan: x is its centre, y its base. 0,0 is the middle of the pan's surface; up is negative. */
export interface Spot {
  x: number
  y: number
}

export interface Outline {
  x: number
  y: number
  w: number
  h: number
}

/** Tokens are drawn at a base size and scaled up by this much on the scale. */
export const TOKEN_SCALE = 1.18
export const BOX_W = 78
export const BOX_H = 73
export const UNIT = 40

const BOX_PITCH = BOX_W + 8
const UNIT_PITCH = UNIT + 4
/** Rows of round weights nestle into the row below, like stacked oranges. */
const UNIT_RISE = 38

/** Weights along the bottom of a pile that holds `units`, at most three rows high. */
function pileBase(units: number): number {
  return units <= 4 ? units : Math.ceil((units + 3) / 3)
}

function pile(units: number, centre: number): Spot[] {
  const base = pileBase(units)
  const spots: Spot[] = []
  let row = 0
  let left = units
  while (left > 0) {
    const count = Math.min(Math.max(base - row, 1), left)
    for (let i = 0; i < count; i++) {
      spots.push({ x: centre + (i - (count - 1) / 2) * UNIT_PITCH, y: -row * UNIT_RISE })
    }
    left -= count
    row++
  }
  return spots
}

/**
 * Lay out one pan. Normally boxes stand on the left and loose weights pile up
 * on the right. While sharing into `groups`, everything is dealt out into that
 * many equal clusters so the split can be seen before the spares are removed.
 */
export function layoutPan(
  pan: Pan,
  groups: number | null,
): { boxes: Spot[]; units: Spot[]; outlines: Outline[] } {
  if (groups && groups > 1 && pan.boxes === groups && pan.units === 0) {
    const pitch = BOX_W + 22
    const boxes = Array.from({ length: groups }, (_, g) => ({ x: (g - (groups - 1) / 2) * pitch, y: 0 }))
    return {
      boxes,
      units: [],
      outlines: boxes.map((b) => ({ x: b.x - BOX_W / 2 - 7, y: -BOX_H - 9, w: BOX_W + 14, h: BOX_H + 14 })),
    }
  }

  if (groups && groups > 1 && pan.boxes === 0 && pan.units % groups === 0 && pan.units > 0) {
    const per = pan.units / groups
    const cols = per <= 3 ? 1 : 2
    const rows = Math.ceil(per / cols)
    const width = cols * UNIT_PITCH - 4
    const pitch = width + 30
    const units: Spot[] = []
    const outlines: Outline[] = []
    for (let g = 0; g < groups; g++) {
      const centre = (g - (groups - 1) / 2) * pitch
      for (let k = 0; k < per; k++) {
        const row = Math.floor(k / cols)
        const inRow = Math.min(cols, per - row * cols)
        units.push({ x: centre + ((k % cols) - (inRow - 1) / 2) * UNIT_PITCH, y: -row * UNIT_PITCH })
      }
      outlines.push({
        x: centre - width / 2 - 9,
        y: -rows * UNIT_PITCH - 3,
        w: width + 18,
        h: rows * UNIT_PITCH + 8,
      })
    }
    return { boxes: [], units, outlines }
  }

  const base = pileBase(pan.units)
  const boxCols = pan.boxes === 0 ? 0 : pan.boxes >= 3 || base <= 4 ? Math.min(pan.boxes, 2) : 1
  const boxesWide = boxCols === 0 ? 0 : boxCols * BOX_PITCH - 8
  const unitsWide = pan.units === 0 ? 0 : base * UNIT_PITCH - 4
  const gap = boxesWide > 0 && unitsWide > 0 ? 18 : 0
  const start = -(boxesWide + gap + unitsWide) / 2

  const boxes: Spot[] = []
  for (let i = 0; i < pan.boxes; i++) {
    const row = Math.floor(i / boxCols)
    const inRow = Math.min(boxCols, pan.boxes - row * boxCols)
    boxes.push({
      x: start + boxesWide / 2 + ((i % boxCols) - (inRow - 1) / 2) * BOX_PITCH,
      y: -row * (BOX_H + 1),
    })
  }

  return { boxes, units: pile(pan.units, start + boxesWide + gap + unitsWide / 2), outlines: [] }
}
