import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Celebrations } from './components/Celebrations'
import { Hud } from './components/Hud'
import { PackReveal } from './components/PackReveal'
import { Rail } from './components/Rail'
import { Settings } from './components/Settings'
import { Welcome } from './components/Welcome'
import { BalanceLab } from './screens/BalanceLab'
import { Collection } from './screens/Collection'
import { Flashcards } from './screens/Flashcards'
import { Home } from './screens/Home'
import { Practice } from './screens/Practice'
import { Progress } from './screens/Progress'
import { useName, useStore, type Tab } from './store/store'

const TITLES: Record<Exclude<Tab, 'home'>, string> = {
  lab: 'Balance Lab',
  practice: 'Practice',
  cards: 'Flashcards',
  collection: 'Collection',
  progress: 'Progress',
}

function Screen({ tab }: { tab: Tab }) {
  switch (tab) {
    case 'home':
      return <Home />
    case 'lab':
      return <BalanceLab />
    case 'practice':
      return <Practice />
    case 'cards':
      return <Flashcards />
    case 'collection':
      return <Collection />
    case 'progress':
      return <Progress />
  }
}

/** A short message that slides up from the bottom and goes away by itself. */
function Toast() {
  const toast = useStore((s) => s.toast)
  const [shown, setShown] = useState(toast)

  useEffect(() => {
    if (!toast) return
    setShown(toast)
    const timer = window.setTimeout(() => setShown(null), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[60] flex justify-center" role="status">
      <AnimatePresence>
        {shown && (
          <motion.div
            key={shown.key}
            className="rounded-full border-2 border-ink bg-hi px-6 py-2.5 font-display text-lg font-bold shadow-doodle"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            {shown.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Shift + D and Shift + R, for whoever is presenting. Ignored while typing. */
function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return
      // Compared without case, so the shortcuts still work with Caps Lock on.
      const key = e.key.toLowerCase()
      if (key === 'd') useStore.getState().loadDemo()
      if (key === 'r') useStore.getState().reset()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export default function App() {
  const tab = useStore((s) => s.tab)
  const welcomed = useStore((s) => s.profile.welcomed)
  const name = useName()
  const [settings, setSettings] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  useShortcuts()

  // After changing page, keyboard focus moves to the new page's heading rather than staying on the tab.
  useEffect(() => {
    heading.current?.focus()
  }, [tab, welcomed])

  if (!welcomed) {
    return (
      <>
        <Welcome />
        <Toast />
      </>
    )
  }

  return (
    <div className="flex h-screen">
      <Rail onSettings={() => setSettings(true)} />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-6 px-10 pt-6 pb-5">
          <h1 ref={heading} tabIndex={-1} className="truncate text-4xl outline-none">
            {tab === 'home' ? `Hi, ${name}` : TITLES[tab]}
          </h1>
          <Hud />
        </header>

        <motion.div
          key={tab}
          className="min-h-0 flex-1 overflow-y-auto px-10 pb-7"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <Screen tab={tab} />
        </motion.div>
      </main>

      <PackReveal />
      <Celebrations />
      {settings && <Settings onClose={() => setSettings(false)} />}
      <Toast />
    </div>
  )
}
