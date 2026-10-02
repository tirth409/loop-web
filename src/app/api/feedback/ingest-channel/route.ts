import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Channel } from "@prisma/client";
import { classifyAndSaveFeedback } from "@/lib/classification-service";
const SOURCE_MAP: Record<string, { channel: Channel; samples: string[] }> = {
  Zendesk: {
    channel: "SUPPORT_TICKET",
    samples: [
      "Can't reset my password, the reset link keeps expiring instantly.",
      "Getting a 500 error when I try to export my report to PDF.",
      "Support macro suggested restarting, that didn't fix the sync issue.",
      "Ticket has been open for 5 days with no update, please advise.",
    ],
  },
  AppStore: {
    channel: "APP_STORE",
    samples: [
      "App freezes on the reports tab after the latest update.",
      "Clean UI, but push notifications arrive hours late.",
      "Would love an iPad-optimized layout, feels stretched right now.",
    ],
  },
  GooglePlay: {
    channel: "APP_STORE",
    samples: [
      "Battery drain is noticeable when the app runs in the background.",
      "Dark mode looks great, exactly what I asked for last review.",
    ],
  },
  Typeform: {
    channel: "NPS_SURVEY",
    samples: [
      "Overall happy, but onboarding could explain permissions better.",
      "Would recommend to a colleague, support team is responsive.",
      "Missing a way to bulk-edit feedback status from the inbox.",
    ],
  },
  Gong: {
    channel: "SALES_CALL",
    samples: [
      "Champion asked again about SOC 2 report before renewal.",
      "Prospect compared pricing to a competitor mid-call, flagged for AE follow-up.",
      "Customer wants a dedicated Slack channel for support escalations.",
    ],
  },
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === "VIEWER") {
    return NextResponse.json(
      { message: "Viewers cannot ingest feedback." },
      { status: 403 }
    );
  }

  const { channel: sourceName } = await req.json();
  const source = SOURCE_MAP[sourceName];
  if (!source) {
    return NextResponse.json({ message: "Unknown channel source" }, { status: 400 });
  }

    const count = Math.floor(Math.random() * 10) + 5; // 5–14 items per ingest
  const rows = Array.from({ length: count }, (_, i) => ({
    content: source.samples[i % source.samples.length],
    channel: source.channel,
    customerLabel: `${sourceName} import`,
    status: "NEW" as const,
    sentiment: "NEUTRAL" as const,
    workspaceId: session.user.workspaceId,
  }));

  const created = await db.feedback.createManyAndReturn({ data: rows });

  for (const row of created) {
    await classifyAndSaveFeedback(row.id, session.user.workspaceId);
  }

  return NextResponse.json({ imported: count });
}