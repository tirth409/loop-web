import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseCsv } from "@/lib/csv";
import { classifyAndSaveFeedback } from "@/lib/classification-service";
import type { Channel } from "@prisma/client";

const VALID_CHANNELS: Channel[] = [
  "SUPPORT_TICKET",
  "APP_STORE",
  "NPS_SURVEY",
  "SALES_CALL",
  "COMMUNITY",
  "OTHER",
];

function isValidChannel(value: string): value is Channel {
  return (VALID_CHANNELS as string[]).includes(value);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === "VIEWER") {
    return NextResponse.json(
      { message: "Viewers cannot import feedback." },
      { status: 403 },
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return NextResponse.json({ imported: 0, failed: 0, errors: [] });
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const contentIdx = header.indexOf("content");
  const channelIdx = header.indexOf("channel");
  const labelIdx = header.indexOf("customerlabel");
  const sourceIdx = header.indexOf("sourceref");

  const errors: { row: number; reason: string }[] = [];
    const toInsert: {
    content: string;
    channel: Channel;
    customerLabel: string | null;
    sourceRef: string | null;
  }[] = [];

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    const content = contentIdx >= 0 ? cols[contentIdx]?.trim() : "";

    if (!content) {
      errors.push({ row: i + 1, reason: "Content is empty" });
      continue;
    }

    const channelRaw =
      channelIdx >= 0 ? (cols[channelIdx]?.trim().toUpperCase() ?? "") : "";
    const channel: Channel = isValidChannel(channelRaw) ? channelRaw : "OTHER";

    toInsert.push({
      content,
      channel,
      customerLabel: labelIdx >= 0 ? cols[labelIdx]?.trim() || null : null,
      sourceRef: sourceIdx >= 0 ? cols[sourceIdx]?.trim() || null : null,
    });
  }

  if (toInsert.length > 0) {
    const created = await db.feedback.createManyAndReturn({
      data: toInsert.map((row) => ({
        ...row,
        status: "NEW" as const,
        sentiment: "NEUTRAL" as const,
        workspaceId: session.user.workspaceId,
      })),
    });

    // AI1: classify each imported row. Sequential on purpose — keeps this
    // simple and avoids bursting past API rate limits on large CSVs.
    for (const row of created) {
      await classifyAndSaveFeedback(row.id, session.user.workspaceId);
    }
  }

  return NextResponse.json({
    imported: toInsert.length,
    failed: errors.length,
    errors,
  });
}
