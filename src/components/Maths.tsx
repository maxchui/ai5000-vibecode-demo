import { fmtEq, fmtSide, MINUS, sideTokens, type Tok } from '../engine/format'
import type { Equation, Side } from '../engine/types'
import { X } from './X'

function Tokens({ toks }: { toks: Tok[] }) {
  return (
    <>
      {toks.map((tok, i) => {
        switch (tok.t) {
          case 'num':
            return <span key={i}>{tok.v}</span>
          case 'x':
            return (
              <span key={i}>
                {tok.coef}
                <X />
              </span>
            )
          case 'op':
            // The typeface's own minus is short. Between two terms it is drawn to match the + and = around it.
            return tok.v === MINUS ? (
              <span
                key={i}
                role="img"
                aria-label="minus"
                className="relative -top-[0.07em] mx-[0.3em] inline-block h-[0.135em] w-[0.5em] rounded-[0.02em] bg-current align-middle"
              />
            ) : (
              <span key={i} className="mx-[0.3em]">
                {tok.v}
              </span>
            )
          case 'open':
            return <span key={i}>(</span>
          case 'close':
            return <span key={i}>)</span>
          case 'frac':
            return (
              <span
                key={i}
                className="mx-[0.08em] inline-flex flex-col items-center align-middle text-[0.74em] leading-none"
              >
                <span className="px-[0.2em] pb-[0.14em]">
                  <Tokens toks={tok.num} />
                </span>
                <span className="h-[0.1em] w-full rounded-full bg-current" />
                <span className="pt-[0.16em]">{tok.den}</span>
              </span>
            )
        }
      })}
    </>
  )
}

/** A whole equation, set in the display face. Size it with a text-size class. */
export function Maths({ eq, className = '' }: { eq: Equation; className?: string }) {
  return (
    <span className={`maths ${className}`} role="math" aria-label={fmtEq(eq)}>
      <Tokens toks={sideTokens(eq.left)} />
      <span className="mx-[0.3em]">=</span>
      <Tokens toks={sideTokens(eq.right)} />
    </span>
  )
}

export function MathsSide({ side, className = '' }: { side: Side; className?: string }) {
  return (
    <span className={`maths ${className}`} role="math" aria-label={fmtSide(side)}>
      <Tokens toks={sideTokens(side)} />
    </span>
  )
}
