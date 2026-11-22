import type { Match } from "@/lib/mock-data";

export type FilterType = "all" | "live" | "today" | "week";

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function filterMatches(matches: Match[], filter: FilterType): Match[] {
  if (filter === "all") return matches;

  const now = new Date();

  if (filter === "live") {
    return matches.filter((m) => m.status === "live");
  }

  if (filter === "today") {
    return matches.filter((m) => isSameCalendarDay(new Date(m.kickoff), now));
  }

  if (filter === "week") {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);
    return matches.filter((m) => {
      const kickoff = new Date(m.kickoff);
      return kickoff >= startOfToday && kickoff <= sevenDaysFromNow;
    });
  }

  return matches;
}
