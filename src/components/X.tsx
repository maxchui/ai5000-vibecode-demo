import { Fragment } from 'react'

/**
 * The letter x, drawn the way a maths teacher writes it: two back-to-back
 * curves, so it can never be mistaken for a times sign. It is orange wherever
 * it appears. It scales with the text around it.
 */
export function X({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={`x-glyph ${className}`} role="img" aria-label="x">
      <path d="M14 12C56 26 56 74 14 88" />
      <path d="M86 12C44 26 44 74 86 88" />
    </svg>
  )
}

/** A lone x used as a variable: "2x", "x + 3", but not the x in "next" or "box". */
const VARIABLE = /(?<![A-Za-z])x(?![A-Za-z])/

/** Ordinary text, with every variable x swapped for the drawn one. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(VARIABLE)
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <X />}
          {part}
        </Fragment>
      ))}
    </>
  )
}
