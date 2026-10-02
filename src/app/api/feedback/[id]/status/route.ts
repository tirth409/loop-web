import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { toFeedbackDTO } from "@/lib/mappers";

const statusSchema = z.object({
  status: z.enum(["NEW", "REVIEWED", "ACTIONED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === "VIEWER") {
    return NextResponse.json(
      { message: "Viewers cannot change feedback status." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  // Tenant isolation: confirm this row belongs to the caller's workspace
  // before touching it — never trust the :id alone.
  const existing = await db.feedback.findFirst({
    where: { id: params.id, workspaceId: session.user.workspaceId },
  });
  if (!existing) {
    return NextResponse.json({ message: "Feedback not found" }, { status: 404 });
  }

  const updated = await db.feedback.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
    include: { themes: { include: { theme: true } } },
  });

  return NextResponse.json(toFeedbackDTO(updated));
}