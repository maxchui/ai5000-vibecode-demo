import {
  BookImage,
  ChartColumn,
  House,
  Layers,
  Scale,
  Settings as Cog,
  Target,
  Volume2,
  VolumeX,
  type LucideIcon,
} from 'lucide-react'
import { sfx } from '../lib/sfx'
import { useStore, type Tab } from '../store/store'
import { X } from './X'

export const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'lab', label: 'Balance Lab', icon: Scale },
  { id: 'practice', label: 'Practice', icon: Target },
  { id: 'cards', label: 'Flashcards', icon: Layers },
  { id: 'collection', label: 'Collection', icon: BookImage },
  { id: 'progress', label: 'Progress', icon: ChartColumn },
]

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-2 font-display leading-none font-black ${className}`}
      aria-label="Find X"
    >
      <span>Find</span>
      <span className="grid h-[1.25em] w-[1.25em] place-items-center rounded-[0.3em] border-2 border-ink bg-white shadow-doodle-sm">
        <X />
      </span>
    </div>
  )
}

/**
 * The side of the exercise book. Each page has an index tab; the open page's
 * tab is paper-white and joins on to the page itself.
 */
export function Rail({ onSettings }: { onSettings: () => void }) {
  const tab = useStore((s) => s.tab)
  const go = useStore((s) => s.go)
  const packs = useStore((s) => s.profile.packs)
  const muted = useStore((s) => s.muted)
  const toggleMuted = useStore((s) => s.toggleMuted)

  return (
    <nav className="flex w-[13.5rem] shrink-0 flex-col border-r-2 border-ink bg-cobalt pt-7 pb-5 text-white">
      <Logo className="px-6 text-[2rem]" />

      <ul className="mt-9 flex flex-col gap-1.5 pl-4">
        {TABS.map(({ id, label, icon: Icon }) => {
          const open = tab === id
          return (
            <li key={id}>
              <button
                type="button"
                aria-current={open ? 'page' : undefined}
                onClick={() => {
                  if (!open) sfx.tap()
                  go(id)
                }}
                className={`relative flex w-[calc(100%+2px)] items-center gap-3 rounded-l-xl border-y-2 border-l-2 py-3 pr-3 pl-4 text-left font-display text-lg font-bold transition-colors focus-visible:outline-hi focus-visible:-outline-offset-4 ${
                  open ? 'border-ink bg-paper text-ink' : 'border-transparent text-white hover:bg-white/15'
                }`}
              >
                <Icon className="h-6 w-6 shrink-0" strokeWidth={2.4} aria-hidden />
                {label}
                {id === 'collection' && packs > 0 && (
                  <span
                    className="tabular ml-auto grid h-6 min-w-6 place-items-center rounded-full border-2 border-ink bg-hi px-1 text-sm leading-none font-black text-ink"
                    aria-label={packs === 1 ? '1 pack to open' : `${packs} packs to open`}
                  >
                    {packs}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto flex gap-2 px-4">
        <button
          type="button"
          onClick={toggleMuted}
          aria-pressed={muted}
          aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
          title={muted ? 'Turn sound on' : 'Turn sound off'}
          className="grid h-11 w-11 place-items-center rounded-xl text-white transition-colors hover:bg-white/15 focus-visible:outline-hi"
        >
          {muted ? (
            <VolumeX className="h-6 w-6" strokeWidth={2.4} />
          ) : (
            <Volume2 className="h-6 w-6" strokeWidth={2.4} />
          )}
        </button>
        <button
          type="button"
          onClick={onSettings}
          aria-label="Settings"
          title="Settings"
          className="grid h-11 w-11 place-items-center rounded-xl text-white transition-colors hover:bg-white/15 focus-visible:outline-hi"
        >
          <Cog className="h-6 w-6" strokeWidth={2.4} />
        </button>
      </div>
    </nav>
  )
}
