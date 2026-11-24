/**
 * Sound effects, made on the spot with the Web Audio API. There are no audio
 * files, so nothing can fail to load.
 */

let ctx: AudioContext | null = null
let muted = false

export function setMuted(value: boolean) {
  muted = value
}

function audio(): AudioContext | null {
  if (muted || typeof AudioContext === 'undefined') return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

interface Note {
  freq: number
  /** Seconds from now. */
  at?: number
  /** Seconds. */
  for?: number
  wave?: OscillatorType
  vol?: number
  /** Glide to this frequency over the note. */
  to?: number
}

function play({ freq, at = 0, for: length = 0.12, wave = 'triangle', vol = 0.1, to }: Note) {
  const a = audio()
  if (!a) return
  const start = a.currentTime + at
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = wave
  osc.frequency.setValueAtTime(freq, start)
  if (to) osc.frequency.exponentialRampToValueAtTime(to, start + length)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(vol, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length)
  osc.connect(gain).connect(a.destination)
  osc.start(start)
  osc.stop(start + length + 0.03)
}

const run = (freqs: number[], gap: number, note: Omit<Note, 'freq' | 'at'>) =>
  freqs.forEach((freq, i) => play({ ...note, freq, at: i * gap }))

export const sfx = {
  tap: () => play({ freq: 520, for: 0.05, vol: 0.05 }),
  pop: () => play({ freq: 360, to: 660, for: 0.09, wave: 'sine' }),
  drop: () => play({ freq: 300, to: 150, for: 0.13, wave: 'sine' }),
  flip: () => play({ freq: 680, to: 980, for: 0.07, vol: 0.05 }),
  right: () => run([659, 988], 0.09, { for: 0.2 }),
  wrong: () => run([208, 156], 0.13, { for: 0.2, wave: 'sawtooth', vol: 0.06 }),
  tip: () => play({ freq: 440, to: 150, for: 0.5, wave: 'sine', vol: 0.09 }),
  share: () => run([392, 523, 659], 0.07, { for: 0.14, wave: 'sine' }),
  reveal: () => run([523, 659, 784, 1047], 0.08, { for: 0.26 }),
  rip: () => play({ freq: 1100, to: 170, for: 0.2, wave: 'sawtooth', vol: 0.05 }),
  shine: () => run([1047, 1319, 1568, 2093, 2637], 0.07, { for: 0.45, wave: 'sine', vol: 0.07 }),
  cheer: () => run([523, 659, 784, 1047, 1319], 0.09, { for: 0.3, wave: 'square', vol: 0.045 }),
}
