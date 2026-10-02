import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { toTeamMemberDTO } from "@/lib/mappers";

const roleSchema = z.object({ role: z.enum(["ADMIN", "ANALYST", "VIEWER"]) });

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Only admins can change roles." }, { status: 403 });
  }
  // Also guarantees the workspace always keeps at least one admin.
  if (params.id === session.user.id) {
    return NextResponse.json(
      { message: "You can't change your own role. Ask another admin." },
      { status: 400 }
    );
  }

  const parsed = roleSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid role." }, { status: 400 });
  }

  // Tenant isolation: the target must belong to the admin's workspace.
  const target = await db.user.findFirst({
    where: { id: params.id, workspaceId: session.user.workspaceId },
  });
  if (!target) {
    return NextResponse.json({ message: "Member not found" }, { status: 404 });
  }

  const updated = await db.user.update({
    where: { id: params.id },
    data: { role: parsed.data.role },
  });
  return NextResponse.json(toTeamMemberDTO(updated));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Only admins can remove members." }, { status: 403 });
  }
  if (params.id === session.user.id) {
    return NextResponse.json({ message: "You can't remove yourself." }, { status: 400 });
  }

  const target = await db.user.findFirst({
    where: { id: params.id, workspaceId: session.user.workspaceId },
  });
  if (!target) {
    return NextResponse.json({ message: "Member not found" }, { status: 404 });
  }

  await db.user.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}