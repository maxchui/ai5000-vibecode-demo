import {
  Brain,
  CalendarDays,
  Check,
  Crown,
  Flame,
  Hand,
  Layers,
  Repeat,
  Scale,
  Star,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { badgeInfo, type BadgeId, type BadgeTone } from '../store/badges'

const ICONS: Record<BadgeId, LucideIcon> = {
  'first-solve': Check,
  'on-fire': Flame,
  'brain-power': Brain,
  lightning: Zap,
  'bounce-back': Repeat,
  balanced: Scale,
  'scale-master': Crown,
  'card-collector': Layers,
  'warming-up': CalendarDays,
  'week-warrior': Trophy,
  'high-five': Hand,
  'skill-master': Star,
}

const FILL: Record<BadgeTone, string> = {
  hi: 'var(--color-hi)',
  box: 'var(--color-box)',
  cobalt: 'var(--color-cobalt)',
  tick: 'var(--color-tick)',
}

/** An eight-point seal, like a sticker a teacher puts on good work. */
export function BadgeIcon({
  id,
  earned = true,
  className = '',
}: {
  id: BadgeId
  earned?: boolean
  className?: string
}) {
  const badge = badgeInfo(id)
  const Icon = ICONS[id]
  const fill = earned ? FILL[badge.tone] : 'var(--color-white)'
  const line = earned ? 'var(--color-ink)' : 'var(--color-mist)'
  const iconColour = !earned
    ? 'var(--color-mist)'
    : badge.tone === 'hi'
      ? 'var(--color-ink)'
      : 'var(--color-white)'
  const square = { x: 16, y: 16, width: 68, height: 68, rx: 10 }
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 100 100" className="block h-full w-full overflow-visible">
        {earned && (
          <g transform="translate(4 4)" fill="var(--color-ink)">
            <rect {...square} />
            <rect {...square} transform="rotate(45 50 50)" />
          </g>
        )}
        {/* Outlines first, then the fills again on top to hide the lines where the two squares cross. */}
        <g
          fill={fill}
          stroke={line}
          strokeWidth="6"
          strokeLinejoin="round"
          strokeDasharray={earned ? undefined : '7 6'}
        >
          <rect {...square} />
          <rect {...square} transform="rotate(45 50 50)" />
        </g>
        <g fill={fill}>
          <rect {...square} />
          <rect {...square} transform="rotate(45 50 50)" />
        </g>
      </svg>
      <Icon
        className="absolute top-1/2 left-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2"
        strokeWidth={2.6}
        color={iconColour}
        aria-hidden
      />
    </div>
  )
}
