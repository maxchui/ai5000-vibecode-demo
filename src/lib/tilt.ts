import { useEffect, useRef } from 'react'

/**
 * How a card moves:
 *   still  it does not move at all (a thumbnail in the album)
 *   hover  it tips towards the pointer and settles flat when the pointer leaves
 *   sway   as hover, and it rocks gently by itself, so the foil keeps catching
 *          the light for people who are watching rather than holding the mouse
 */
export type TiltMode = 'still' | 'hover' | 'sway'

/** The most the card tips, in degrees. */
const MAX = 15

/**
 * Tips an element in 3D and tells its foil where the light is. Everything is
 * passed to CSS as custom properties on the element, so React never re-renders
 * while the card moves. Put the ref on a wrapper that stays still and let a
 * child do the turning: measuring an element that is itself tipping would make
 * the numbers chase each other.
 */
export function useTilt<T extends HTMLElement>(mode: TiltMode, phase = 0) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || mode === 'still') return

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const swaying = mode === 'sway' && !calm
    let frame = 0
    let last = 0
    let pointing = false
    // Where the light is across the card, from 0 to 1. Target first, then where it has got to.
    let tx = 0.5
    let ty = 0.5
    let x = 0.5
    let y = 0.5

    const write = () => {
      const rx = (0.5 - y) * 2 * MAX
      const ry = (x - 0.5) * 2 * MAX
      const off = Math.min(1, Math.hypot(x - 0.5, y - 0.5) * 2.4)
      const s = el.style
      s.setProperty('--mx', `${(x * 100).toFixed(2)}%`)
      s.setProperty('--my', `${(y * 100).toFixed(2)}%`)
      s.setProperty('--rx', `${rx.toFixed(2)}deg`)
      s.setProperty('--ry', `${ry.toFixed(2)}deg`)
      s.setProperty('--fx', `${(50 + (x - 0.5) * 90).toFixed(2)}%`)
      s.setProperty('--fy', `${(50 + (y - 0.5) * 90).toFixed(2)}%`)
      s.setProperty('--shine', (0.35 + 0.65 * off).toFixed(3))
      s.setProperty('--sx', `${(ry * 0.012).toFixed(3)}em`)
      s.setProperty('--sy', `${(rx * 0.012).toFixed(3)}em`)
    }

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - (last || now)) / 1000)
      last = now
      if (!pointing) {
        if (swaying) {
          const t = now / 1000 + phase
          tx = 0.5 + 0.34 * Math.sin(t * 0.95)
          ty = 0.5 + 0.2 * Math.sin(t * 1.45 + 1.1)
        } else {
          tx = 0.5
          ty = 0.5
        }
      }
      // The same easing whatever the screen's refresh rate.
      const ease = 1 - Math.exp(-dt * (pointing ? 14 : 5))
      x += (tx - x) * ease
      y += (ty - y) * ease
      write()

      const settled = Math.abs(tx - x) < 0.002 && Math.abs(ty - y) < 0.002
      if (pointing || swaying || !settled) {
        frame = requestAnimationFrame(step)
      } else {
        frame = 0
        last = 0
        el.removeAttribute('data-live')
      }
    }

    const start = () => {
      if (frame) return
      el.setAttribute('data-live', '')
      frame = requestAnimationFrame(step)
    }

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      tx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
      ty = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))
      pointing = true
      start()
    }
    const onLeave = () => {
      pointing = false
      start()
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    if (swaying) start()

    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(frame)
      el.removeAttribute('data-live')
    }
  }, [mode, phase])

  return ref
}
