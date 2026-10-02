import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { format, subDays } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const workspaceId = session.user.workspaceId;
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const fourteenDaysAgo = subDays(now, 14);

  const themes = await db.theme.findMany({
    where: { workspaceId },
    include: {
      feedback: { include: { feedback: true } },
    },
  });

  const result = themes.map((theme) => {
    const items = theme.feedback.map((ft) => ft.feedback);
    const feedbackCount = items.length;

    const recent = items.filter((f) => f.createdAt >= sevenDaysAgo).length;
    const prev = items.filter(
      (f) => f.createdAt >= fourteenDaysAgo && f.createdAt < sevenDaysAgo
    ).length;
    const growthPct = prev === 0 ? (recent > 0 ? 100 : 0) : Math.round(((recent - prev) / prev) * 100);

    const sentiment = {
      positive: items.filter((f) => f.sentiment === "POSITIVE").length,
      neutral: items.filter((f) => f.sentiment === "NEUTRAL").length,
      negative: items.filter((f) => f.sentiment === "NEGATIVE").length,
    };

    const volMap = new Map<string, number>();
    for (let i = 13; i >= 0; i--) volMap.set(format(subDays(now, i), "MMM d"), 0);
    items.forEach((f) => {
      const key = format(f.createdAt, "MMM d");
      if (volMap.has(key)) volMap.set(key, (volMap.get(key) ?? 0) + 1);
    });

    return {
      id: theme.id,
      name: theme.name,
      description: theme.description ?? "",
      feedbackCount,
      growthPct,
      sentiment,
      isSpike: growthPct >= 30 && recent >= 3,
      volumeOverTime: Array.from(volMap.entries()).map(([date, count]) => ({ date, count })),
    };
  });

  return NextResponse.json(result);
}