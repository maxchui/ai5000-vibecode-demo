export type CardGroup = 'Words' | 'Rules' | 'Spot the mistake'

export interface Flashcard {
  id: string
  group: CardGroup
  /** What the front of the card says. A line break is kept as written. */
  front: string
  /** Set when the front is a line of working rather than a word. */
  frontIsMaths?: boolean
  back: string
  example?: string
}

export const FLASHCARDS: Flashcard[] = [
  {
    id: 'variable',
    group: 'Words',
    front: 'Variable',
    back: 'A letter that stands for a number you do not know yet.',
    example: 'In 2x + 3 = 11, the variable is x.',
  },
  {
    id: 'coefficient',
    group: 'Words',
    front: 'Coefficient',
    back: 'The number multiplying a variable.',
    example: 'In 5x, the coefficient is 5.',
  },
  {
    id: 'constant',
    group: 'Words',
    front: 'Constant',
    back: 'A plain number with no variable attached.',
    example: 'In 2x + 3, the constant is 3.',
  },
  {
    id: 'term',
    group: 'Words',
    front: 'Term',
    back: 'One part of an expression. Terms are separated by + or − signs.',
    example: '2x + 3 has two terms: 2x and 3.',
  },
  {
    id: 'equation',
    group: 'Words',
    front: 'Equation',
    back: 'A statement that two things are equal. It always has an equals sign.',
    example: '2x + 3 = 11 is an equation. 2x + 3 alone is an expression.',
  },
  {
    id: 'solution',
    group: 'Words',
    front: 'Solution',
    back: 'The value of the variable that makes the equation true.',
    example: 'x = 4 solves 2x + 3 = 11, because 2 × 4 + 3 = 11.',
  },
  {
    id: 'like-terms',
    group: 'Words',
    front: 'Like terms',
    back: 'Terms with the same variable part. You can add or subtract them.',
    example: '3x + 5x = 8x. But 3x + 5 cannot be combined.',
  },
  {
    id: 'inverse',
    group: 'Words',
    front: 'Inverse operation',
    back: 'The operation that undoes another one.',
    example: 'Adding undoes subtracting. Multiplying undoes dividing.',
  },
  {
    id: 'golden-rule',
    group: 'Rules',
    front: 'The golden rule',
    back: 'Whatever you do to one side of an equation, do the same to the other side.',
    example: 'If x + 3 = 8, subtract 3 from both sides: x = 5.',
  },
  {
    id: 'reverse-order',
    group: 'Rules',
    front: 'Which step comes first?',
    back: 'Undo adding and subtracting first. Then undo multiplying and dividing.',
    example: '2x + 3 = 11. First subtract 3, then divide by 2.',
  },
  {
    id: 'expand',
    group: 'Rules',
    front: 'Expanding brackets',
    back: 'Multiply the number outside by every term inside.',
    example: '3(x + 2) = 3x + 6.',
  },
  {
    id: 'both-sides',
    group: 'Rules',
    front: 'x on both sides',
    back: 'Collect the x terms on one side first. Subtract the smaller x term from both sides.',
    example: '5x = 3x + 8. Subtract 3x from both sides: 2x = 8.',
  },
  {
    id: 'check',
    group: 'Rules',
    front: 'Checking an answer',
    back: 'Put your answer back into the original equation. Both sides should come out equal.',
    example: 'Try x = 4 in 2x + 3 = 11. You get 2 × 4 + 3 = 11. It works.',
  },
  {
    id: 'negative-coefficient',
    group: 'Rules',
    front: 'A negative in front of x',
    back: 'Divide both sides by the negative number, minus sign included.',
    example: '−3x = 12. Divide both sides by −3: x = −4.',
  },
  {
    id: 'mistake-sign',
    group: 'Spot the mistake',
    front: '2x + 3 = 11,\nso 2x = 14',
    frontIsMaths: true,
    back: 'They added 3 instead of subtracting it. To undo + 3, subtract 3 from both sides.',
    example: 'It should be 2x = 8.',
  },
  {
    id: 'mistake-expand',
    group: 'Spot the mistake',
    front: '3(x + 2) = 3x + 2',
    frontIsMaths: true,
    back: 'The 3 only multiplied the x. It has to multiply everything inside the brackets.',
    example: 'It should be 3(x + 2) = 3x + 6.',
  },
]
