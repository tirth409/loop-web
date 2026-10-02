import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { classifyAndSaveFeedback } from "@/lib/classification-service";
import { toFeedbackDTO } from "@/lib/mappers";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const channel = searchParams.get("channel") || undefined;
  const sentiment = searchParams.get("sentiment") || undefined;
  const status = searchParams.get("status") || undefined;
  const theme = searchParams.get("theme") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
    // Dates arrive as YYYY-MM-DD; treat the range as inclusive whole days (UTC).
  const DAY = /^\d{4}-\d{2}-\d{2}$/;
  const from = dateFrom && DAY.test(dateFrom) ? new Date(`${dateFrom}T00:00:00.000Z`) : undefined;
  const to = dateTo && DAY.test(dateTo) ? new Date(`${dateTo}T23:59:59.999Z`) : undefined;
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "10");

  const where: Prisma.FeedbackWhereInput = {
    // Tenant isolation: every query is scoped to the caller's workspace.
    workspaceId: session.user.workspaceId,
    ...(channel ? { channel: channel as Prisma.EnumChannelFilter["equals"] } : {}),
    ...(sentiment ? { sentiment: sentiment as Prisma.EnumSentimentNullableFilter["equals"] } : {}),
    ...(status ? { status: status as Prisma.EnumFeedbackStatusFilter["equals"] } : {}),
    ...(theme ? { themes: { some: { theme: { name: theme } } } } : {}),
    ...(search
      ? {
          OR: [
            { content: { contains: search, mode: "insensitive" } },
            { customerLabel: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
        ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    db.feedback.count({ where }),
    db.feedback.findMany({
      where,
      include: { themes: { include: { theme: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    data: rows.map(toFeedbackDTO),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

const addFeedbackSchema = z.object({
  content: z.string().min(1),
  channel: z.enum(["SUPPORT_TICKET", "APP_STORE", "NPS_SURVEY", "SALES_CALL", "COMMUNITY", "OTHER"]),
  customerLabel: z.string().optional(),
  sourceRef: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  // RBAC: Viewers are read-only (Section 08, C2).
  if (session.user.role === "VIEWER") {
    return NextResponse.json({ message: "Viewers cannot add feedback." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = addFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

    const feedback = await db.feedback.create({
    data: {
      ...parsed.data,
      status: "NEW",
      sentiment: "NEUTRAL", // overwritten by classification below
      workspaceId: session.user.workspaceId,
    },
  });

  // AI1: classify on ingest. Failure here shouldn't fail the whole request —
  // the item just stays NEUTRAL/untagged until re-classified.
  await classifyAndSaveFeedback(feedback.id, session.user.workspaceId);

  const classified = await db.feedback.findUniqueOrThrow({
    where: { id: feedback.id },
    include: { themes: { include: { theme: true } } },
  });

  return NextResponse.json(toFeedbackDTO(classified), { status: 201 });

}