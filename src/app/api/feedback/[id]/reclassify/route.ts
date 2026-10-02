import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { classifyAndSaveFeedback } from "@/lib/classification-service";
import { toFeedbackDTO } from "@/lib/mappers";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === "VIEWER") {
    return NextResponse.json(
      { message: "Viewers cannot reclassify feedback." },
      { status: 403 }
    );
  }

  const existing = await db.feedback.findFirst({
    where: { id: params.id, workspaceId: session.user.workspaceId },
  });
  if (!existing) {
    return NextResponse.json({ message: "Feedback not found" }, { status: 404 });
  }

  await classifyAndSaveFeedback(params.id, session.user.workspaceId);

  const updated = await db.feedback.findUniqueOrThrow({
    where: { id: params.id },
    include: { themes: { include: { theme: true } } },
  });

  return NextResponse.json(toFeedbackDTO(updated));
}