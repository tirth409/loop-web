import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { toFeedbackDTO } from "@/lib/mappers";
import { format, subDays, startOfDay } from "date-fns";

const ALLOWED_RANGES = [7, 14, 30, 90];

// null = not enough data in the previous period for a meaningful comparison.
// Large swings are capped so the UI never shows something absurd like "2500%".
const pctChange = (curr: number, prev: number): number | null => {
  if (prev < 3) return null;
  const pct = Math.round(((curr - prev) / prev) * 100);
  return Math.max(-100, Math.min(pct, 500));
};
const round1 = (n: number) => Math.round(n * 10) / 10;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const workspaceId = session.user.workspaceId;

  const requested = Number(new URL(req.url).searchParams.get("days"));
  const days = ALLOWED_RANGES.includes(requested) ? requested : 30;

  const now = new Date();
  const start = startOfDay(subDays(now, days - 1)); // window: [start, now]
  const prevStart = subDays(start, days); // previous window: [prevStart, start)
  const weekStart = startOfDay(subDays(now, 6));
  const prevWeekStart = subDays(weekStart, 7);

  const inWindow = { gte: start };
  const inPrev = { gte: prevStart, lt: start };

  const [
    total,
    prevTotal,
    negative,
    prevNegative,
    newThisWeek,
    newPrevWeek,
    activeThemes,
    prevActiveThemes,
    windowRows,
    recentRaw,
    themeRows,
  ] = await Promise.all([
    db.feedback.count({ where: { workspaceId, createdAt: inWindow } }),
    db.feedback.count({ where: { workspaceId, createdAt: inPrev } }),
    db.feedback.count({
      where: { workspaceId, createdAt: inWindow, sentiment: "NEGATIVE" },
    }),
    db.feedback.count({
      where: { workspaceId, createdAt: inPrev, sentiment: "NEGATIVE" },
    }),
    db.feedback.count({
      where: { workspaceId, createdAt: { gte: weekStart } },
    }),
    db.feedback.count({
      where: { workspaceId, createdAt: { gte: prevWeekStart, lt: weekStart } },
    }),
    db.theme.count({
      where: {
        workspaceId,
        feedback: { some: { feedback: { createdAt: inWindow } } },
      },
    }),
    db.theme.count({
      where: {
        workspaceId,
        feedback: { some: { feedback: { createdAt: inPrev } } },
      },
    }),
    db.feedback.findMany({
      where: { workspaceId, createdAt: inWindow },
      select: { createdAt: true, sentiment: true },
    }),
    db.feedback.findMany({
      where: { workspaceId, createdAt: inWindow },
      include: { themes: { include: { theme: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.theme.findMany({
      where: { workspaceId },
      select: {
        name: true,
        _count: {
          select: {
            feedback: { where: { feedback: { createdAt: inWindow } } },
          },
        },
      },
    }),
  ]);

  // Volume chart: one bucket per day in the window.
  const volumeMap = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    volumeMap.set(format(subDays(now, i), "MMM d"), 0);
  }
  windowRows.forEach((f) => {
    const key = format(f.createdAt, "MMM d");
    if (volumeMap.has(key)) volumeMap.set(key, (volumeMap.get(key) ?? 0) + 1);
  });

  // Sentiment breakdown within the window.
  const sentimentPct = (s: string) =>
    total === 0
      ? 0
      : Math.round(
          (windowRows.filter((f) => f.sentiment === s).length / total) * 100,
        );

  const negPct = total === 0 ? 0 : round1((negative / total) * 100);
  const prevNegPct =
    prevTotal === 0 ? 0 : round1((prevNegative / prevTotal) * 100);

  const topThemes = themeRows
    .map((t) => ({ theme: t.name, count: t._count.feedback }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return NextResponse.json({
    stats: {
      totalFeedback: total,
      negativePct: negPct,
      newThisWeek,
      activeThemes,
      totalFeedbackTrend: pctChange(total, prevTotal),
      // percentage-point change vs the previous period
      negativePctTrend: prevTotal < 3 ? null : round1(negPct - prevNegPct),
      newThisWeekTrend: pctChange(newThisWeek, newPrevWeek),
      activeThemesTrend: pctChange(activeThemes, prevActiveThemes),
    },
    volumeChart: Array.from(volumeMap.entries()).map(([date, count]) => ({
      date,
      count,
    })),
    sentimentBreakdown: {
      positive: sentimentPct("POSITIVE"),
      neutral: sentimentPct("NEUTRAL"),
      negative: sentimentPct("NEGATIVE"),
    },
    topThemes,
    recentFeedback: recentRaw.map(toFeedbackDTO),
  });
}
