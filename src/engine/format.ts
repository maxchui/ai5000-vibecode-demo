import type { Equation, Lin, Side } from './types'

/** The real minus sign, not a hyphen. */
export const MINUS = '−'

export const fmtNum = (n: number): string => (n < 0 ? `${MINUS}${Math.abs(n)}` : `${n}`)

/** A number written so it can follow an operator: negatives get brackets. */
export const paren = (n: number): string => (n < 0 ? `(${fmtNum(n)})` : `${n}`)

/** "x", "−x", "3x", "−3x". */
export const xTerm = (a: number): string => (a === 1 ? 'x' : a === -1 ? `${MINUS}x` : `${fmtNum(a)}x`)

/** "+ 3" or "− 3". */
export const signed = (n: number): string => `${n >= 0 ? '+' : MINUS} ${Math.abs(n)}`

/**
 * Display tokens. The screen and the plain-text version are both built from
 * these, so what is drawn and what is read aloud can never drift apart.
 */
export type Tok =
  | { t: 'num'; v: string }
  | { t: 'x'; coef: string }
  | { t: 'op'; v: string }
  | { t: 'open' }
  | { t: 'close' }
  | { t: 'frac'; num: Tok[]; den: string }

export function linTokens({ a, b }: Lin): Tok[] {
  if (a === 0) return [{ t: 'num', v: fmtNum(b) }]
  const coef = a === 1 ? '' : a === -1 ? MINUS : fmtNum(a)
  const toks: Tok[] = [{ t: 'x', coef }]
  if (b !== 0) toks.push(...plusTokens(b))
  return toks
}

function plusTokens(n: number): Tok[] {
  if (n === 0) return []
  return [
    { t: 'op', v: n > 0 ? '+' : MINUS },
    { t: 'num', v: `${Math.abs(n)}` },
  ]
}

export function sideTokens(side: Side): Tok[] {
  switch (side.kind) {
    case 'lin':
      return linTokens(side)
    case 'bracket': {
      const toks: Tok[] = []
      if (side.k === -1) toks.push({ t: 'num', v: MINUS })
      else if (side.k !== 1) toks.push({ t: 'num', v: fmtNum(side.k) })
      toks.push({ t: 'open' }, ...linTokens(side.inner), { t: 'close' }, ...plusTokens(side.plus))
      return toks
    }
    case 'frac':
      return [{ t: 'frac', num: linTokens(side.num), den: `${side.den}` }, ...plusTokens(side.plus)]
  }
}

export function tokensToText(toks: Tok[]): string {
  let out = ''
  for (const tok of toks) {
    switch (tok.t) {
      case 'num':
        out += tok.v
        break
      case 'x':
        out += `${tok.coef}x`
        break
      case 'op':
        out += ` ${tok.v} `
        break
      case 'open':
        out += '('
        break
      case 'close':
        out += ')'
        break
      case 'frac': {
        const inner = tokensToText(tok.num)
        out += tok.num.length === 1 ? `${inner}/${tok.den}` : `(${inner})/${tok.den}`
        break
      }
    }
  }
  return out
}

export const fmtLin = (l: Lin): string => tokensToText(linTokens(l))
export const fmtSide = (s: Side): string => tokensToText(sideTokens(s))
export const fmtEq = (e: Equation): string => `${fmtSide(e.left)} = ${fmtSide(e.right)}`
