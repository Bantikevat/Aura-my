// Spaced repetition (SM-2). Pure local maths — no AI, no server, no cost.
// A card carries: ease (≥1.3), interval (days), reps, due (ISO or null = new).

// Grade a review: quality 0-5 (Again=1, Hard=3, Good=4, Easy=5) → updated scheduling.
export function schedule(card, quality) {
  let ease = card.ease ?? 2.5;
  let interval = card.interval ?? 0;
  let reps = card.reps ?? 0;

  if (quality < 3) {
    reps = 0;
    interval = 1; // relearn tomorrow
  } else {
    reps += 1;
    interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(interval * ease);
  }
  ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  return {
    ...card,
    ease: Number(ease.toFixed(2)),
    interval,
    reps,
    due: new Date(Date.now() + interval * 86400000).toISOString(),
    lastReviewed: new Date().toISOString(),
  };
}

// A never-reviewed card (no due) is due now; otherwise due when its date has passed.
export function isDue(card, now = Date.now()) {
  return !card.due || new Date(card.due).getTime() <= now;
}

export function dueCards(cards, now = Date.now()) {
  return cards.filter((c) => isDue(c, now));
}
