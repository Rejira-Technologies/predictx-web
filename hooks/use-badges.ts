/**
 * Computes the longest consecutive winning streak from completed stakes.
 * Stakes are sorted chronologically by resolvedAt before evaluating outcomes,
 * because store ordering is not guaranteed to represent resolution order.
 */
function longestConsecutiveWonStreak(
  completedStakes: Array<{
    outcome?: "won" | "lost";
    resolvedAt?: string | number | Date;
  }>,
): number {
  const chronologicalStakes = [...completedStakes].sort((a, b) => {
    const timeA = a.resolvedAt
      ? new Date(a.resolvedAt).getTime()
      : 0;

    const timeB = b.resolvedAt
      ? new Date(b.resolvedAt).getTime()
      : 0;

    return timeA - timeB;
  });

  let best = 0;
  let current = 0;

  for (const stake of chronologicalStakes) {
    if (stake.outcome === "won") {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  return best;
}