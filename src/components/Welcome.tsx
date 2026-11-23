import { motion } from 'motion/react'
import { useState } from 'react'
import { sfx } from '../lib/sfx'
import { useStore } from '../store/store'
import { Bubble, Coach } from './Coach'
import { Logo } from './Rail'
import { Rich } from './X'

/** First run: the coach introduces itself and asks for a name. */
export function Welcome() {
  const welcome = useStore((s) => s.welcome)
  const loadDemo = useStore((s) => s.loadDemo)
  const [name, setName] = useState('')

  const start = () => {
    sfx.reveal()
    welcome(name)
  }

  return (
    <div className="grid h-screen place-items-center p-10">
      <div className="flex max-w-[66rem] items-center gap-12">
        <motion.div
          initial={{ y: -260, rotate: -14 }}
          animate={{ y: 0, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 170, damping: 11, delay: 0.15 }}
        >
          <Coach mood="happy" className="h-[22rem] w-[22rem]" />
        </motion.div>

        <motion.div
          className="flex-1"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.35 }}
        >
          <Logo className="text-6xl" />
          <Bubble className="mt-7 !px-7 !py-6 !text-2xl">
            <Rich text="I'm Coach X. Every equation hides a number, and I'll help you find it. What should I call you?" />
          </Bubble>
          <form
            className="mt-6 flex gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              start()
            }}
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 18))}
              placeholder="Your name"
              aria-label="Your name"
              className="min-w-0 flex-1 rounded-2xl border-2 border-ink bg-white px-5 py-3 font-display text-2xl font-bold placeholder:font-normal placeholder:text-mist"
            />
            <button type="submit" className="key key-primary key-lg">
              Start
            </button>
          </form>
          <button type="button" className="link mt-5 -ml-2 text-base" onClick={loadDemo}>
            Or load the demo player, with two weeks of progress
          </button>
        </motion.div>
      </div>
    </div>
  )
}
