import { motion } from 'motion/react'
import { useId } from 'react'

const INK = 'var(--color-ink)'
const W = 120
const H = 164
/** Where the top of the wrapper tears off. */
const TEAR = 25

/** The wrapper's outline: straight sides, crimped along the top and bottom like a real foil pack. */
const OUTLINE = (() => {
  const teeth = Array.from({ length: 13 }, (_, i) => i)
  const top = teeth.map((i) => `${i * 10} ${i % 2 === 0 ? 6 : 1}`)
  const bottom = teeth.map((i) => `${W - i * 10} ${i % 2 === 0 ? H - 6 : H - 1}`)
  return `M${top.join('L')}L${bottom.join('L')}Z`
})()

function Wrapper({ clip }: { clip: string }) {
  return (
    <>
      <path d={OUTLINE} fill="var(--color-cobalt)" />
      <g clipPath={`url(#${clip})`}>
        <path d="M0 122L120 84V112L0 150Z" fill="var(--color-hi)" />
        <rect width={W} height={TEAR} fill={INK} opacity="0.3" />
        <rect y={H - 21} width={W} height="21" fill={INK} opacity="0.3" />
        <rect className="animate-sheen" x="45" y="-10" width="26" height="190" fill="#fff" opacity="0.32" />
      </g>
      <path d={`M7 ${TEAR}H113`} stroke="#fff" strokeWidth="2" strokeDasharray="5 5" opacity="0.75" />

      <g transform="rotate(-6 60 60)">
        <rect x="36" y="36" width="48" height="48" rx="12" fill={INK} transform="translate(3 3.5)" />
        <rect
          x="36"
          y="36"
          width="48"
          height="48"
          rx="12"
          fill="var(--color-white)"
          stroke={INK}
          strokeWidth="4"
        />
        <g
          transform="translate(46 46) scale(0.28)"
          fill="none"
          stroke="var(--color-box)"
          strokeWidth="19"
          strokeLinecap="round"
        >
          <path d="M14 12C56 26 56 74 14 88" />
          <path d="M86 12C44 26 44 74 86 88" />
        </g>
      </g>

      <text
        x="60"
        y="118"
        transform="rotate(-17.6 60 117)"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-display)"
        fontWeight="900"
        fontSize="17"
        fill={INK}
      >
        3 cards
      </text>
      <path d={OUTLINE} fill="none" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    </>
  )
}

/**
 * A sealed pack of cards. When torn, the top strip flies off and the rest
 * drops away. It is drawn twice, once for each piece.
 */
export function Pack({ torn = false, className = '' }: { torn?: boolean; className?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg
      viewBox={`-6 -6 ${W + 12} ${H + 12}`}
      className={`block overflow-visible ${className}`}
      role="img"
      aria-label="A sealed pack of three cards"
    >
      <defs>
        <clipPath id={`${id}-all`}>
          <path d={OUTLINE} />
        </clipPath>
        <clipPath id={`${id}-top`}>
          <rect x="-10" y="-10" width={W + 20} height={TEAR + 10.5} />
        </clipPath>
        <clipPath id={`${id}-rest`}>
          <rect x="-10" y={TEAR} width={W + 20} height={H} />
        </clipPath>
      </defs>
      <motion.g
        clipPath={`url(#${id}-rest)`}
        initial={false}
        animate={torn ? { y: 40, opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeIn', delay: torn ? 0.2 : 0 }}
      >
        <Wrapper clip={`${id}-all`} />
      </motion.g>
      <motion.g
        clipPath={`url(#${id}-top)`}
        initial={false}
        animate={torn ? { x: 54, y: -46, rotate: 34, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.38, ease: 'easeOut' }}
      >
        <Wrapper clip={`${id}-all`} />
      </motion.g>
    </svg>
  )
}
