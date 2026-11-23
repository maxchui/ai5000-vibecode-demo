export type BadgeId =
  | 'first-solve'
  | 'on-fire'
  | 'brain-power'
  | 'lightning'
  | 'bounce-back'
  | 'balanced'
  | 'scale-master'
  | 'card-collector'
  | 'warming-up'
  | 'week-warrior'
  | 'high-five'
  | 'skill-master'

export type BadgeTone = 'hi' | 'box' | 'cobalt' | 'tick'

export interface Badge {
  id: BadgeId
  name: string
  /** How to earn it, as an instruction. */
  how: string
  tone: BadgeTone
}

export const BADGES: Badge[] = [
  { id: 'first-solve', name: 'First solve', how: 'Get your first answer right', tone: 'tick' },
  { id: 'on-fire', name: 'On fire', how: 'Get 5 right in a row', tone: 'box' },
  { id: 'brain-power', name: 'Brain power', how: 'Get 5 right in a row with no hints', tone: 'cobalt' },
  { id: 'lightning', name: 'Lightning', how: 'Answer correctly in under 8 seconds', tone: 'hi' },
  { id: 'bounce-back', name: 'Bounce back', how: 'Get one right straight after a miss', tone: 'tick' },
  { id: 'balanced', name: 'Balanced', how: 'Solve an equation in the Balance Lab', tone: 'cobalt' },
  { id: 'scale-master', name: 'Scale master', how: 'Solve all six Balance Lab challenges', tone: 'hi' },
  { id: 'card-collector', name: 'Card collector', how: 'Mark every flashcard as known', tone: 'box' },
  { id: 'warming-up', name: 'Warming up', how: 'Keep a 3-day streak', tone: 'box' },
  { id: 'week-warrior', name: 'Week warrior', how: 'Keep a 7-day streak', tone: 'hi' },
  { id: 'high-five', name: 'High five', how: 'Reach level 5', tone: 'tick' },
  {
    id: 'skill-master',
    name: 'Skill master',
    how: 'Get 9 of your last 10 right in one skill',
    tone: 'cobalt',
  },
]

export const badgeInfo = (id: BadgeId): Badge => BADGES.find((b) => b.id === id)!
