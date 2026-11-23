import { AnimatePresence, motion, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useEffect } from 'react'
import { tilt, type LabState, type Pan } from '../../engine/lab'
import { layoutPan, TOKEN_SCALE } from './layout'

const INK = 'var(--color-ink)'

const PIVOT = { x: 500, y: 112 }
/** Pivot to the end of the beam. */
const ARM = 318
/** Beam end down to the surface the tokens stand on. */
const DROP = 208
const PAN_W = 384
const MAX_TILT = 9

const rad = (deg: number) => (deg * Math.PI) / 180

const settle = { type: 'spring', stiffness: 240, damping: 21 } as const

/** A loose weight worth 1. */
function Weight() {
  return (
    <g transform={`scale(${TOKEN_SCALE})`}>
      <circle cy="-17" r="16" fill="var(--color-hi)" stroke={INK} strokeWidth="4" />
      <path
        d="M-9 -24A12 12 0 0 1 2 -29"
        fill="none"
        stroke="var(--color-white)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <text
        y="-16"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-display)"
        fontWeight="800"
        fontSize="19"
        fill={INK}
      >
        1
      </text>
    </g>
  )
}

/** A mystery box. It is labelled x, and when the puzzle is solved its lid lifts to show the number. */
function Box({ open, value }: { open: boolean; value: number }) {
  return (
    <g transform={`scale(${TOKEN_SCALE})`}>
      <AnimatePresence>
        {open && (
          <motion.g
            initial={{ y: -20, scale: 0.2, opacity: 0 }}
            animate={{ y: -112, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 190, damping: 11, delay: 0.25 }}
          >
            <path
              d="M0-40L10-17 34-25 23-3 44 10 20 15 23 39 4 25-10 44-15 20-39 20-22 3-37-17-13-17Z"
              fill="var(--color-hi)"
              stroke={INK}
              strokeWidth="4.5"
              strokeLinejoin="round"
            />
            <text
              y="2"
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="var(--font-display)"
              fontWeight="900"
              fontSize="38"
              fill={INK}
            >
              {value}
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      <rect
        x="-29"
        y="-50"
        width="58"
        height="50"
        rx="11"
        fill="var(--color-box)"
        stroke={INK}
        strokeWidth="4.5"
      />
      <rect
        x="-17"
        y="-40"
        width="34"
        height="30"
        rx="8"
        fill="var(--color-white)"
        stroke={INK}
        strokeWidth="3.5"
      />
      <g
        transform="translate(-10.5 -35.5) scale(0.21)"
        fill="none"
        stroke="var(--color-box)"
        strokeWidth="21"
        strokeLinecap="round"
      >
        <path d="M14 12C56 26 56 74 14 88" />
        <path d="M86 12C44 26 44 74 86 88" />
      </g>

      <motion.g
        initial={false}
        animate={open ? { y: -70, x: 64, rotate: 80, opacity: 0 } : { y: 0, x: 0, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
      >
        <rect
          x="-33"
          y="-62"
          width="66"
          height="17"
          rx="7"
          fill="var(--color-white)"
          stroke={INK}
          strokeWidth="4.5"
        />
      </motion.g>
    </g>
  )
}

function PanView({
  pan,
  x,
  y,
  groups,
  open,
  value,
}: {
  pan: Pan
  x: MotionValue<number>
  y: MotionValue<number>
  groups: number | null
  open: boolean
  value: number
}) {
  const spots = layoutPan(pan, groups)
  const half = PAN_W / 2
  return (
    <motion.g style={{ x, y }}>
      <g fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round">
        <path d={`M0 6L${-half + 16} ${DROP}`} />
        <path d={`M0 6L${half - 16} ${DROP}`} />
      </g>
      <path
        d={`M${-half + 8} ${DROP}L${half - 8} ${DROP}Q${half - 20} ${DROP + 40} ${half - 78} ${DROP + 40}L${-half + 78} ${DROP + 40}Q${-half + 20} ${DROP + 40} ${-half + 8} ${DROP}Z`}
        fill="var(--color-cobalt)"
        stroke={INK}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <rect
        x={-half}
        y={DROP - 7}
        width={PAN_W}
        height="14"
        rx="7"
        fill="var(--color-white)"
        stroke={INK}
        strokeWidth="5"
      />

      <g transform={`translate(0 ${DROP - 8})`}>
        <AnimatePresence>
          {spots.outlines.map((o, i) => (
            <motion.rect
              key={`outline-${i}`}
              x={o.x}
              y={o.y}
              width={o.w}
              height={o.h}
              rx="12"
              fill="var(--color-hi)"
              fillOpacity="0.35"
              stroke={INK}
              strokeWidth="3.5"
              strokeDasharray="9 8"
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.25, duration: 0.25 }}
            />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {spots.boxes.map((spot, i) => (
            <motion.g
              key={`box-${i}`}
              initial={{ x: spot.x, y: spot.y - 170, opacity: 0 }}
              animate={{ x: spot.x, y: spot.y, opacity: 1 }}
              exit={{ y: spot.y - 150, opacity: 0, transition: { duration: 0.32, ease: 'easeIn' } }}
              transition={{ ...settle, delay: i * 0.06 }}
            >
              <Box open={open && i === 0} value={value} />
            </motion.g>
          ))}
          {spots.units.map((spot, i) => (
            <motion.g
              key={`unit-${i}`}
              initial={{ x: spot.x, y: spot.y - 170, opacity: 0 }}
              animate={{ x: spot.x, y: spot.y, opacity: 1 }}
              exit={{ y: spot.y - 150, opacity: 0, transition: { duration: 0.32, ease: 'easeIn' } }}
              transition={{ ...settle, delay: 0.1 + i * 0.03 }}
            >
              <Weight />
            </motion.g>
          ))}
        </AnimatePresence>
      </g>
    </motion.g>
  )
}

/**
 * The balance scale. The beam swings on a soft spring, so it wobbles before
 * it settles, and both pans hang from wherever the ends of the beam are.
 */
export function Scale({
  state,
  groups,
  solved,
  nudge,
}: {
  state: LabState
  /** Set while the pans are being shared out into this many groups. */
  groups: number | null
  solved: boolean
  /** Changes whenever a balanced move is made, to give the beam a little wobble. */
  nudge: number
}) {
  const lean = tilt(state)
  // Left pan heavier means the left end goes down: anticlockwise, a negative angle.
  const target = -lean * MAX_TILT
  const angle = useSpring(0, { stiffness: 46, damping: 4.6, mass: 1.1 })

  useEffect(() => {
    angle.set(target)
  }, [angle, target])

  useEffect(() => {
    if (nudge === 0) return
    angle.jump(nudge % 2 === 0 ? 2.6 : -2.6)
    angle.set(target)
    // Deliberately keyed on nudge alone: only a new nudge should wobble the beam.
  }, [nudge])

  const leftX = useTransform(angle, (a) => PIVOT.x - ARM * Math.cos(rad(a)))
  const leftY = useTransform(angle, (a) => PIVOT.y - ARM * Math.sin(rad(a)))
  const rightX = useTransform(angle, (a) => PIVOT.x + ARM * Math.cos(rad(a)))
  const rightY = useTransform(angle, (a) => PIVOT.y + ARM * Math.sin(rad(a)))

  return (
    <svg
      viewBox="-16 0 1032 540"
      className="block h-full w-full overflow-visible"
      role="img"
      aria-label={
        lean === 0
          ? 'A balance scale, level'
          : `A balance scale, tipped: the ${lean > 0 ? 'left' : 'right'} side is heavier`
      }
    >
      <path d="M318 524H682" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path
        d="M412 522L440 474H560L588 522Z"
        fill="var(--color-cobalt)"
        stroke={INK}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <rect
        x="488"
        y={PIVOT.y}
        width="24"
        height={476 - PIVOT.y}
        rx="6"
        fill="var(--color-white)"
        stroke={INK}
        strokeWidth="5"
      />

      <g transform={`translate(${PIVOT.x} ${PIVOT.y})`}>
        {/* Everything in here is symmetrical about the pivot, so it turns around its own middle. */}
        <motion.g style={{ rotate: angle }}>
          <rect
            x={-ARM - 22}
            y="-11"
            width={2 * ARM + 44}
            height="22"
            rx="11"
            fill="var(--color-white)"
            stroke={INK}
            strokeWidth="5"
          />
          <circle cx={-ARM} r="6" fill={INK} />
          <circle cx={ARM} r="6" fill={INK} />
        </motion.g>
        <circle r="19" fill="var(--color-hi)" stroke={INK} strokeWidth="5" />
        <circle r="5" fill={INK} />
      </g>

      <PanView pan={state.left} x={leftX} y={leftY} groups={groups} open={solved} value={state.x} />
      <PanView pan={state.right} x={rightX} y={rightY} groups={groups} open={false} value={state.x} />
    </svg>
  )
}
