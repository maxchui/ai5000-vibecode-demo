import { motion } from 'motion/react'
import { Maths } from '../../components/Maths'
import { Rich } from '../../components/X'
import { fmtNum } from '../../engine/format'
import { evalSide } from '../../engine/solve'
import type { Problem, Step } from '../../engine/types'

/** "Subtract 3 from both sides, to undo the + 3." A reason that is already a sentence gets its own. */
const explain = (step: Step) =>
  /^[A-Z]/.test(step.why) ? `${step.label}. ${step.why}` : `${step.label}, ${step.why}.`

/** The worked solution, set out like working in an exercise book: one line per step, with the reason in the margin. */
export function Steps({ problem }: { problem: Problem }) {
  const { equation, steps, solution } = problem
  const value = fmtNum(evalSide(equation.right, solution))
  const row = (i: number) => ({
    initial: { opacity: 0, x: -14 },
    animate: { opacity: 1, x: 0 },
    transition: { delay: 0.1 + i * 0.28, duration: 0.25 },
  })

  return (
    <div className="grid grid-cols-[auto_minmax(0,26rem)] items-center gap-x-9 gap-y-5 text-left">
      <motion.div {...row(0)}>
        <Maths eq={equation} className="text-4xl" />
      </motion.div>
      <motion.p {...row(0)} className="text-lg">
        Start here.
      </motion.p>

      {steps.map((step, i) => {
        const last = i === steps.length - 1
        return (
          <div key={i} className="contents">
            <motion.div {...row(i + 1)}>
              <Maths eq={step.result} className={`text-4xl ${last ? 'marked' : ''}`} />
            </motion.div>
            <motion.p {...row(i + 1)} className="flex items-baseline gap-3 text-lg leading-snug">
              <span className="chip shrink-0 border-2 border-ink bg-white">
                <Rich text={step.short} />
              </span>
              <span>
                <Rich text={explain(step)} />
              </span>
            </motion.p>
          </div>
        )
      })}

      <motion.p {...row(steps.length + 1)} className="col-span-2 mt-1 text-lg">
        <Rich
          text={`Check: put x = ${fmtNum(solution)} back into the first line. Both sides come to ${value}, so it works.`}
        />
      </motion.p>
    </div>
  )
}
