# Find X

A study coach for solving linear equations, pitched at grade 7–8. It was built as a showpiece for a vibe-coding workshop: something to put on a projector and say "this was made by describing it".

Everything runs in the browser. There are no accounts, no internet connection and no API key. The coach's lines are prewritten and the questions are generated on the spot.

## Run it

**Quickest:** double-click `Find-X.html`. It is one self-contained file that works offline, so it can also live on a USB stick.

**From source:**

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173.

Put the browser in full screen before presenting. The app sizes itself to the screen, so a projector gets large type automatically.

## A five-minute path for presenting

1. **Welcome.** Type a student's name and press Start.
2. **Press Shift + D.** This loads a demo player with two weeks of progress and keeps the name you typed. It is set up so that good things are about to happen.
3. **Home.** Answer the warm-up question. The streak reaches 7 days and a badge appears.
4. **Balance Lab.** Challenge 5 is waiting. Pick the one-sided move first to tip the scale, put the weights back, then solve it properly and watch the box open. Challenge 6 completes the set and reaches level 5.
5. **Practice.** Start a round of Brackets. One right answer unlocks the last skill. Get one wrong on purpose to show the worked steps, and press "Show a hint" once.
6. **Flashcards.** Space flips a card. The arrow keys sort it.
7. **Progress.** Point at the chart bars and the badges.

Shift + R starts again from zero. Both shortcuts are also in Settings (the cog, bottom left).

## What is in it

- **Balance Lab:** an equation shown as a balance scale. Six set challenges plus endless random ones.
- **Practice:** five skills, from one-step equations to fractions and negatives. Three kinds of question, three hints each, and a full worked solution after a miss.
- **Flashcards:** sixteen cards on the words and rules of algebra.
- **Progress:** XP per day, mastery of each skill, and twelve badges.
- XP, levels, a daily goal and a day streak run through all of it.

## Good to know

- The coach cannot answer free-form questions. Everything it says is prewritten.
- The Balance Lab only uses positive whole numbers, because that is what a real scale can show. Negatives, fractions and brackets are in Practice.
- It is laid out for a laptop or projector, not a phone.
- Progress is saved in whichever browser opened it. The double-click file and the `npm run dev` version keep separate progress.
- Sound is on by default. The speaker icon, bottom left, mutes it.

## For the curious

| Folder | What lives there |
| --- | --- |
| `src/engine` | Makes the questions, solves them step by step, and runs the balance scale's rules |
| `src/store` | XP, levels, streaks, badges and the demo player |
| `src/screens` | The five screens |
| `src/components` | Shared pieces: the coach, the drawn x, equations, celebrations |

```bash
npm test
```

runs 40 checks. Among other things they generate over 20,000 questions and confirm that every answer is right, every line of working is true, and no multiple-choice question has two correct options.

```bash
npm run build
```

rebuilds `Find-X.html` after a change.
