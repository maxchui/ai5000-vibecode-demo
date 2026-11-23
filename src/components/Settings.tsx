import { X as Close } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { useStore } from '../store/store'

function Shortcut({ keys, does }: { keys: string; does: string }) {
  return (
    <li className="flex items-center gap-3">
      <kbd className="rounded-md border-2 border-ink bg-white px-2 py-0.5 font-display text-sm font-bold whitespace-nowrap">
        {keys}
      </kbd>
      <span>{does}</span>
    </li>
  )
}

export function Settings({ onClose }: { onClose: () => void }) {
  const name = useStore((s) => s.profile.name)
  const rename = useStore((s) => s.rename)
  const muted = useStore((s) => s.muted)
  const toggleMuted = useStore((s) => s.toggleMuted)
  const loadDemo = useStore((s) => s.loadDemo)
  const reset = useStore((s) => s.reset)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-40 grid place-items-center bg-ink/60 p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="sheet relative w-[36rem] max-w-full p-8"
        initial={{ scale: 0.9, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          className="link absolute top-5 right-5 !p-2"
        >
          <Close className="h-6 w-6" strokeWidth={2.6} />
        </button>
        <h2 id="settings-title" className="text-3xl">
          Settings
        </h2>

        <label className="mt-6 block">
          <span className="font-display text-lg font-bold">Your name</span>
          <input
            value={name}
            onChange={(e) => rename(e.target.value.slice(0, 18))}
            placeholder="Solver"
            className="mt-1.5 block w-full rounded-xl border-2 border-ink bg-white px-4 py-2.5 text-lg placeholder:text-mist"
          />
        </label>

        <div className="mt-5 flex items-center justify-between gap-4">
          <span className="font-display text-lg font-bold">Sound effects</span>
          <button type="button" onClick={toggleMuted} aria-pressed={!muted} className="key key-sm min-w-20">
            {muted ? 'Off' : 'On'}
          </button>
        </div>

        <div className="panel mt-6 p-5">
          <h3 className="text-xl">For showing the app to a room</h3>
          <p className="mt-1.5 leading-snug">
            The demo player has two weeks of progress, with a level-up, a badge and a new skill each a few
            answers away.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="key key-hi"
              onClick={() => {
                loadDemo()
                onClose()
              }}
            >
              Load demo player
            </button>
            <button
              type="button"
              className="key"
              onClick={() => {
                reset()
                onClose()
              }}
            >
              Start again from zero
            </button>
          </div>
          <ul className="mt-5 space-y-2">
            <Shortcut keys="Shift + D" does="Load demo player" />
            <Shortcut keys="Shift + R" does="Start again from zero" />
          </ul>
        </div>
      </motion.div>
    </motion.div>
  )
}
