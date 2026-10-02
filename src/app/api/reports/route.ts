import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { toReportDTO } from "@/lib/mappers";
import { generateReportContent } from "@/lib/report-service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const reports = await db.report.findMany({
    where: { workspaceId: session.user.workspaceId },
    include: { generatedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reports.map(toReportDTO));
}

const generateSchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  // RBAC: Viewers can read reports but not generate them.
  if (session.user.role === "VIEWER") {
    return NextResponse.json(
      { message: "Viewers cannot generate reports." },
      { status: 403 }
    );
  }

  const parsed = generateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please choose a valid date range." },
      { status: 400 }
    );
  }
  const { dateFrom, dateTo } = parsed.data;

  const periodStart = new Date(`${dateFrom}T00:00:00.000Z`);
  const periodEnd = new Date(`${dateTo}T23:59:59.999Z`);
  if (
    Number.isNaN(periodStart.getTime()) ||
    Number.isNaN(periodEnd.getTime()) ||
    periodStart > periodEnd
  ) {
    return NextResponse.json(
      { message: "The start date must be on or before the end date." },
      { status: 400 }
    );
  }
  const days = (periodEnd.getTime() - periodStart.getTime()) / 86_400_000;
  if (days > 366) {
    return NextResponse.json(
      { message: "Please choose a range of one year or less." },
      { status: 400 }
    );
  }

  let content;
  try {
    content = await generateReportContent(
      session.user.workspaceId,
      periodStart,
      periodEnd
    );
  } catch (err) {
    console.error("Report generation failed", err);
    return NextResponse.json(
      { message: "Report generation failed. Please try again." },
      { status: 502 }
    );
  }

  // No data in the period → don't save an empty/filler report.
  if (!content) {
    return NextResponse.json(
      { message: "No feedback was found in that period, so there's nothing to report on." },
      { status: 400 }
    );
  }

  const report = await db.report.create({
    data: {
      title: `Voice of Customer — ${dateFrom} to ${dateTo}`,
      periodStart,
      periodEnd,
      contentJson: content as unknown as Prisma.InputJsonValue,
      workspaceId: session.user.workspaceId,
      generatedById: session.user.id,
    },
    include: { generatedBy: { select: { name: true } } },
  });

  return NextResponse.json(toReportDTO(report), { status: 201 });
}