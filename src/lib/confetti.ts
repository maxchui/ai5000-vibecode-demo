import confetti from 'canvas-confetti'

const COLOURS = ['#2f4bff', '#ffe14a', '#ff7a1f', '#11b76b', '#1a2aa8']

const base = { colors: COLOURS, disableForReducedMotion: true, scalar: 1.15, ticks: 160 }

/** A puff from one point. x and y run from 0 to 1 across the window. */
export function burst(x = 0.5, y = 0.55, amount = 70) {
  void confetti({ ...base, particleCount: amount, spread: 80, startVelocity: 36, origin: { x, y } })
}

/** A puff from the middle of an element. */
export function burstFrom(el: Element | null, amount = 60) {
  if (!el) return burst()
  const r = el.getBoundingClientRect()
  burst((r.left + r.width / 2) / window.innerWidth, (r.top + r.height / 2) / window.innerHeight, amount)
}

/** Both corners at once, for the big moments. */
export function shower() {
  void confetti({
    ...base,
    particleCount: 90,
    angle: 60,
    spread: 70,
    startVelocity: 55,
    origin: { x: 0, y: 0.75 },
  })
  void confetti({
    ...base,
    particleCount: 90,
    angle: 120,
    spread: 70,
    startVelocity: 55,
    origin: { x: 1, y: 0.75 },
  })
}
