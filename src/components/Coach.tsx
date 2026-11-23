import { motion } from 'motion/react'

export type Mood = 'idle' | 'happy' | 'cheer' | 'think' | 'oops'

const INK = 'var(--color-ink)'

function Arm({ d, hand }: { d: string; hand: [number, number] }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
      <circle cx={hand[0]} cy={hand[1]} r="9" fill="var(--color-box)" stroke={INK} strokeWidth="5" />
    </>
  )
}

const ARMS: Record<Mood, { left: [string, [number, number]]; right: [string, [number, number]] }> = {
  idle: {
    left: ['M40 128Q20 136 22 156', [22, 158]],
    right: ['M160 128Q180 136 178 156', [178, 158]],
  },
  happy: {
    left: ['M40 128Q20 136 22 156', [22, 158]],
    right: ['M160 120Q184 108 184 84', [184, 82]],
  },
  cheer: {
    left: ['M40 120Q16 108 16 84', [16, 82]],
    right: ['M160 120Q184 108 184 84', [184, 82]],
  },
  think: {
    left: ['M40 128Q20 136 22 156', [22, 158]],
    right: ['M160 126Q186 146 156 160', [150, 160]],
  },
  oops: {
    left: ['M40 122Q14 112 24 92', [26, 88]],
    right: ['M160 122Q186 112 176 92', [174, 88]],
  },
}

function Eyes({ mood }: { mood: Mood }) {
  if (mood === 'happy' || mood === 'cheer') {
    return (
      <g fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round">
        <path d="M65 122Q78 106 91 122" />
        <path d="M109 122Q122 106 135 122" />
      </g>
    )
  }
  const look = mood === 'think' ? [3.5, -4.5] : mood === 'oops' ? [0, 1] : [0.5, 0.5]
  const pupil = mood === 'oops' ? 4.5 : 6.5
  return (
    <g className={mood === 'idle' ? 'animate-blink' : undefined}>
      {[78, 122].map((cx) => (
        <g key={cx}>
          <ellipse
            cx={cx}
            cy="118"
            rx="13.5"
            ry="15.5"
            fill="var(--color-white)"
            stroke={INK}
            strokeWidth="5"
          />
          <circle cx={cx + look[0]} cy={118 + look[1]} r={pupil} fill={INK} />
          <circle cx={cx + look[0] - 2.2} cy={118 + look[1] - 2.6} r="2" fill="var(--color-white)" />
        </g>
      ))}
      {mood === 'oops' && (
        <g fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round">
          <path d="M64 98L88 104" />
          <path d="M136 98L112 104" />
        </g>
      )}
    </g>
  )
}

function Mouth({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'happy':
      return (
        <path d="M85 141Q100 161 115 141Z" fill={INK} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      )
    case 'cheer':
      return (
        <path d="M82 139Q100 168 118 139Z" fill={INK} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      )
    case 'think':
      return (
        <path d="M93 148Q101 143 110 147" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      )
    case 'oops':
      return (
        <path
          d="M85 150Q92.5 141 100 150T115 150"
          fill="none"
          stroke={INK}
          strokeWidth="5"
          strokeLinecap="round"
        />
      )
    default:
      return (
        <path d="M86 142Q100 156 114 142" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      )
  }
}

function Sparkle({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0-10Q1.5-1.5 10 0Q1.5 1.5 0 10Q-1.5 1.5-10 0Q-1.5-1.5 0-10Z"
      fill="var(--color-hi)"
      stroke={INK}
      strokeWidth={3 / s}
      strokeLinejoin="round"
    />
  )
}

/**
 * Coach X: a crate with a number hidden inside. The same box sits on the
 * balance scale, so the mascot and the unknown are one and the same.
 */
export function Coach({
  mood = 'idle',
  className = '',
  still = false,
}: {
  mood?: Mood
  className?: string
  /** Turn off the idle bobbing. */
  still?: boolean
}) {
  const arms = ARMS[mood]
  return (
    // The wrapper bobs; the drawing inside does a little squash each time the mood changes.
    <div className={`${still ? '' : 'animate-bob'} ${className}`}>
      <motion.svg
        key={mood}
        viewBox="0 0 200 210"
        className="block h-full w-full overflow-visible"
        role="img"
        aria-label="Coach X"
        initial={{ scaleY: 0.88, scaleX: 1.08 }}
        animate={{ scaleY: 1, scaleX: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 11 }}
        style={{ originY: 1 }}
      >
        <ellipse cx="100" cy="199" rx="56" ry="7" fill={INK} opacity="0.14" />

        <g fill={INK}>
          <rect x="70" y="166" width="15" height="26" rx="7.5" />
          <rect x="115" y="166" width="15" height="26" rx="7.5" />
          <ellipse cx="74" cy="194" rx="14" ry="7" />
          <ellipse cx="126" cy="194" rx="14" ry="7" />
        </g>

        <Arm d={arms.left[0]} hand={arms.left[1]} />
        {mood !== 'think' && <Arm d={arms.right[0]} hand={arms.right[1]} />}

        <rect
          x="38"
          y="80"
          width="124"
          height="96"
          rx="24"
          fill="var(--color-box)"
          stroke={INK}
          strokeWidth="6"
        />
        <rect x="46" y="150" width="108" height="18" rx="9" fill="var(--color-box-deep)" opacity="0.35" />
        <circle cx="59" cy="140" r="7" fill="var(--color-white)" opacity="0.4" />
        <circle cx="141" cy="140" r="7" fill="var(--color-white)" opacity="0.4" />

        <Eyes mood={mood} />
        <Mouth mood={mood} />
        {mood === 'think' && <Arm d={arms.right[0]} hand={arms.right[1]} />}

        <rect
          x="27"
          y="56"
          width="146"
          height="38"
          rx="14"
          fill="var(--color-white)"
          stroke={INK}
          strokeWidth="6"
        />
        <g
          transform="translate(87.5 62.5) scale(0.25)"
          fill="none"
          stroke="var(--color-box)"
          strokeWidth="19"
          strokeLinecap="round"
        >
          <path d="M14 12C56 26 56 74 14 88" />
          <path d="M86 12C44 26 44 74 86 88" />
        </g>

        {mood === 'cheer' && (
          <>
            <Sparkle x={38} y={36} s={1.1} />
            <Sparkle x={166} y={30} s={0.8} />
            <Sparkle x={104} y={22} s={0.6} />
          </>
        )}
        {mood === 'oops' && (
          <path
            d="M158 44Q168 58 158 64Q148 58 158 44Z"
            fill="var(--color-mist)"
            stroke={INK}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        )}
      </motion.svg>
    </div>
  )
}

/** A speech bubble for the coach. The tail points left, at the coach. */
export function Bubble({
  children,
  className = '',
  tail = 'left',
}: {
  children: React.ReactNode
  className?: string
  tail?: 'left' | 'bottom' | 'none'
}) {
  const tailClass =
    tail === 'left'
      ? "before:absolute before:top-[1.4rem] before:-left-[0.56rem] before:h-4 before:w-4 before:rotate-45 before:border-b-2 before:border-l-2 before:border-ink before:bg-white before:content-['']"
      : tail === 'bottom'
        ? "before:absolute before:-bottom-[0.56rem] before:left-10 before:h-4 before:w-4 before:rotate-45 before:border-r-2 before:border-b-2 before:border-ink before:bg-white before:content-['']"
        : ''
  return (
    <div
      className={`relative rounded-2xl border-2 border-ink bg-white px-5 py-4 text-lg leading-snug ${tailClass} ${className}`}
    >
      {children}
    </div>
  )
}
