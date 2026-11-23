import { motion } from 'motion/react'

/** A circular meter drawn in pen. Whatever is passed as children sits in the middle. */
export function Ring({
  value,
  colour = 'var(--color-cobalt)',
  track = 'var(--color-sky)',
  thickness = 11,
  outlined = true,
  className = '',
  label,
  children,
}: {
  /** 0 to 100. */
  value: number
  colour?: string
  track?: string
  thickness?: number
  /** Pen outline around the track. On for things you can press, off where the ring only reports a number. */
  outlined?: boolean
  className?: string
  /** Read out by screen readers, e.g. "Two-step equations: 70% mastered". */
  label: string
  children?: React.ReactNode
}) {
  const r = 50 - thickness / 2 - 2
  const around = 2 * Math.PI * r
  const shown = Math.max(0, Math.min(100, value))
  return (
    <div className={`relative ${className}`} role="img" aria-label={label}>
      <svg viewBox="0 0 100 100" className="block h-full w-full -rotate-90">
        {outlined && (
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-ink)" strokeWidth={thickness + 4} />
        )}
        <circle cx="50" cy="50" r={r} fill="none" stroke={track} strokeWidth={thickness} />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={colour}
          strokeWidth={thickness}
          strokeLinecap={shown > 0 && shown < 100 ? 'round' : 'butt'}
          strokeDasharray={around}
          initial={{ strokeDashoffset: around }}
          animate={{ strokeDashoffset: around * (1 - shown / 100) }}
          transition={{ type: 'spring', stiffness: 60, damping: 16 }}
          style={{ opacity: shown > 0 ? 1 : 0 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}
