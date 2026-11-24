import { moveInfo, type MoveId, type MoveTone } from '../content/moves'

const INK = 'var(--color-ink)'
const WHITE = 'var(--color-white)'
const HI = 'var(--color-hi)'

const TONE: Record<MoveTone, { fill: string; pale: string }> = {
  cross: { fill: 'var(--color-cross)', pale: 'var(--color-cross-pale)' },
  tick: { fill: 'var(--color-tick)', pale: 'var(--color-tick-pale)' },
  cobalt: { fill: 'var(--color-cobalt)', pale: 'var(--color-sky)' },
  hi: { fill: HI, pale: '#fff5c2' },
  box: { fill: 'var(--color-box)', pale: 'var(--color-box-pale)' },
}

const SHADOW = 'translate(3 3.5)'

/** A fat line with a pen outline and a drawn shadow: the big sign each card is known by. */
function Chunky({ d, colour, w = 15 }: { d: string; colour: string; w?: number }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={INK} strokeWidth={w + 9} transform={SHADOW} />
      <path d={d} stroke={INK} strokeWidth={w + 9} />
      <path d={d} stroke={colour} strokeWidth={w} />
    </g>
  )
}

function Label({
  x,
  y,
  size,
  fill = INK,
  children,
}: {
  x: number
  y: number
  size: number
  fill?: string
  children: string
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fontFamily="var(--font-display)"
      fontWeight="900"
      fontSize={size}
      fill={fill}
    >
      {children}
    </text>
  )
}

/** The same weight that sits on the Balance Lab scale: worth 1. */
function Weight({ x, y, r = 11 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={HI} stroke={INK} strokeWidth="4" />
      <path
        d={`M${-r * 0.56} ${-r * 0.4}A${r * 0.72} ${r * 0.72} 0 0 1 ${r * 0.08} ${-r * 0.72}`}
        fill="none"
        stroke={WHITE}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <Label x={0} y={0.5} size={r * 1.15}>
        1
      </Label>
    </g>
  )
}

/** The mystery box labelled x, as on the scale. x and y are where the middle of its base stands. */
function Box({ x, y, s = 1, lid = true }: { x: number; y: number; s?: number; lid?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect
        x="-29"
        y="-50"
        width="58"
        height="50"
        rx="11"
        fill="var(--color-box)"
        stroke={INK}
        strokeWidth={4.2 / s}
      />
      <rect x="-17" y="-40" width="34" height="30" rx="8" fill={WHITE} stroke={INK} strokeWidth={3.2 / s} />
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
      {lid && (
        <rect x="-33" y="-62" width="66" height="17" rx="7" fill={WHITE} stroke={INK} strokeWidth={4.2 / s} />
      )}
    </g>
  )
}

/** A square tile with something written on it. */
function Tile({
  x,
  y,
  fill,
  ink = INK,
  children,
}: {
  x: number
  y: number
  fill: string
  ink?: string
  children: string
}) {
  const shape = { x: x - 21, y: y - 20, width: 42, height: 40, rx: 9 }
  return (
    <>
      <rect {...shape} fill={INK} stroke={INK} strokeWidth="4" transform={SHADOW} />
      <rect {...shape} fill={fill} stroke={INK} strokeWidth="4" />
      <Label x={x} y={y + 1} size={22} fill={ink}>
        {children}
      </Label>
    </>
  )
}

function Coin({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <>
      <circle cx={x} cy={y} r="11" fill={WHITE} stroke={INK} strokeWidth="3.5" />
      <Label x={x} y={y + 0.5} size={14}>
        {children}
      </Label>
    </>
  )
}

/** Short pen strokes: speed lines, or anything else too small to need a shape. */
function Ticks({ d, colour = INK }: { d: string; colour?: string }) {
  return (
    <path d={d} fill="none" stroke={colour} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  )
}

function Sparkle({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0-10Q1.5-1.5 10 0Q1.5 1.5 0 10Q-1.5 1.5-10 0Q-1.5-1.5 0-10Z"
      fill={HI}
      stroke={INK}
      strokeWidth={3 / s}
      strokeLinejoin="round"
    />
  )
}

/** Squared paper, like the page the app is drawn on. */
const GRID =
  [20, 40, 60, 80, 100].map((y) => `M0 ${y}H200`).join('') +
  [20, 40, 60, 80, 100, 120, 140, 160, 180].map((x) => `M${x} 0V120`).join('')

/** A sunburst for the holo cards: twelve wedges fanning out from the middle. */
const RAYS = Array.from({ length: 12 }, (_, i) => {
  const at = (deg: number) => {
    const a = (deg * Math.PI) / 180
    return `${(100 + 170 * Math.cos(a)).toFixed(1)} ${(62 + 170 * Math.sin(a)).toFixed(1)}`
  }
  return `M100 62L${at(i * 30 - 4)}L${at(i * 30 + 11)}Z`
}).join('')

function Scene({ id }: { id: MoveId }) {
  const tone = TONE[moveInfo(id).tone].fill
  switch (id) {
    case 'take-it-away':
      return (
        <>
          <Chunky d="M48 64H110" colour={tone} w={16} />
          <Ticks d="M123 51l9-6M128 62l10-4M150 84l8-4" />
          <Weight x={150} y={38} r={13} />
          <Weight x={172} y={70} r={10} />
        </>
      )
    case 'add-it-back':
      return (
        <>
          <Chunky d="M80 36V92M52 64H108" colour={tone} w={16} />
          <Ticks d="M144 24v-11M156 26v-7M167 58v-8M177 60v-6" />
          <Weight x={150} y={48} r={13} />
          <Weight x={172} y={80} r={10} />
        </>
      )
    case 'share-it-out':
      return (
        <>
          <Chunky d="M58 60H142" colour={tone} w={16} />
          <Weight x={100} y={27} r={14} />
          <Weight x={100} y={93} r={14} />
        </>
      )
    case 'times-it-up':
      return (
        <>
          <Chunky d="M56 38L102 84M102 38L56 84" colour={tone} w={15} />
          <Weight x={152} y={88} r={12} />
          <Weight x={152} y={64} r={12} />
          <Weight x={152} y={40} r={12} />
        </>
      )
    case 'check-it':
      return (
        <>
          <Box x={60} y={102} s={0.95} />
          <Chunky d="M112 64L132 84L170 38" colour={tone} w={15} />
        </>
      )
    case 'undo-in-order':
      return (
        <>
          <Ticks d="M12 101H188" />
          <Box x={40} y={99} s={0.78} />
          <Tile x={99} y={77} fill="var(--color-cobalt)" ink={WHITE}>
            ×2
          </Tile>
          <Tile x={157} y={77} fill={HI}>
            +3
          </Tile>
          <Ticks d="M143 24Q128 11 114 22M112 12l1.5 11 11-1.5" />
          <Coin x={157} y={31}>
            1
          </Coin>
          <Coin x={99} y={31}>
            2
          </Coin>
        </>
      )
    case 'collect-the-x':
      return (
        <>
          <Ticks d="M12 100H188" />
          <Box x={42} y={98} s={0.64} />
          <Box x={86} y={98} s={0.64} />
          <Ticks d="M166 62h14M171 75h16M166 88h12" />
          <g transform="rotate(-9 138 96)">
            <Box x={138} y={96} s={0.64} />
          </g>
        </>
      )
    case 'open-the-brackets':
      return (
        <>
          <Ticks d="M23 46l-8-4M19 60H9M23 74l-8 4M177 46l8-4M181 60h10M177 74l8 4" />
          <Chunky d="M54 22Q32 60 54 98" colour={tone} w={11} />
          <Chunky d="M146 22Q168 60 146 98" colour={tone} w={11} />
          <Box x={84} y={92} s={0.7} />
          <Weight x={126} y={80} r={11} />
        </>
      )
    case 'clear-the-fraction':
      return (
        <>
          <Box x={82} y={50} s={0.6} />
          <Weight x={118} y={38} r={10} />
          <Chunky d="M56 63H138" colour={tone} w={9} />
          <Ticks d="M96 84l-10-5M95 96H83" />
          <g transform="rotate(16 122 93)">
            <rect
              x="107"
              y="79"
              width="30"
              height="28"
              rx="7"
              fill={INK}
              stroke={INK}
              strokeWidth="4"
              transform="translate(2.5 3)"
            />
            <rect x="107" y="79" width="30" height="28" rx="7" fill={WHITE} stroke={INK} strokeWidth="4" />
            <Label x={122} y={94} size={19}>
              2
            </Label>
          </g>
        </>
      )
    case 'flip-the-sign':
      return (
        <>
          <Ticks d="M76 30Q100 12 124 30M119.7 19.9L124 30L113.1 28.7" />
          <circle cx="69" cy="71.5" r="27" fill={INK} />
          <circle cx="66" cy="68" r="27" fill="var(--color-cross)" stroke={INK} strokeWidth="4.5" />
          <path d="M52 68H80" stroke={WHITE} strokeWidth="8" strokeLinecap="round" />
          <circle cx="137" cy="71.5" r="27" fill={INK} />
          <circle cx="134" cy="68" r="27" fill="var(--color-tick)" stroke={INK} strokeWidth="4.5" />
          <path d="M134 54V82M120 68H148" stroke={WHITE} strokeWidth="8" strokeLinecap="round" />
        </>
      )
    case 'keep-it-level':
      return (
        <>
          <Chunky d="M100 103V44" colour={WHITE} w={6} />
          <Chunky d="M80 104H120" colour={WHITE} w={6} />
          <Ticks d="M46 44L30 88M46 44L62 88M154 44L138 88M154 44L170 88" />
          <Chunky d="M40 44H160" colour={WHITE} w={6} />
          <Chunky d="M28 91H64" colour={HI} w={5} />
          <Chunky d="M136 91H172" colour={HI} w={5} />
          <Box x={46} y={84} s={0.5} />
          <Weight x={145} y={76} r={8.5} />
          <Weight x={163} y={76} r={8.5} />
          <Weight x={154} y={61} r={8.5} />
          <circle cx="100" cy="44" r="7.5" fill={HI} stroke={INK} strokeWidth="4" />
        </>
      )
    case 'found-x':
      return (
        <>
          <Sparkle x={38} y={34} s={1.1} />
          <Sparkle x={166} y={96} s={0.8} />
          <Sparkle x={48} y={92} s={0.6} />
          <Box x={100} y={110} s={0.92} lid={false} />
          <g transform="rotate(28 152 50)">
            <rect x="122" y="42" width="60" height="16" rx="7" fill={WHITE} stroke={INK} strokeWidth="4.2" />
          </g>
          <g transform="translate(100 40) scale(0.74)">
            <path
              d="M0-40L10-17 34-25 23-3 44 10 20 15 23 39 4 25-10 44-15 20-39 20-22 3-37-17-13-17Z"
              fill={HI}
              stroke={INK}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
            <Label x={0} y={2} size={38}>
              4
            </Label>
          </g>
        </>
      )
  }
}

/**
 * The picture on a card. Drawn, not downloaded, so it works with no internet.
 * It comes in two layers, so that a card's foil can lie over the background
 * and under the things in the picture, which then keep their own colours.
 */
export function MoveArt({ id, layer }: { id: MoveId; layer: 'back' | 'scene' }) {
  const card = moveInfo(id)
  return (
    <svg
      viewBox="0 0 200 120"
      preserveAspectRatio="xMidYMid slice"
      className={layer === 'back' ? 'block h-full w-full' : 'mcard-scene'}
      aria-hidden
    >
      {layer === 'scene' ? (
        <Scene id={id} />
      ) : card.rarity === 'holo' ? (
        <>
          <rect width="200" height="120" fill="var(--color-cobalt)" />
          <path d={RAYS} fill={WHITE} opacity="0.2" />
        </>
      ) : (
        <>
          <rect width="200" height="120" fill={TONE[card.tone].pale} />
          <path d={GRID} fill="none" stroke={WHITE} strokeWidth="1.5" opacity="0.75" />
        </>
      )}
    </svg>
  )
}
