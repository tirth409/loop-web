import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { toTeamMemberDTO } from "@/lib/mappers";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  // RBAC: only Admins manage members (Section 08, C2).
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Only admins can manage members." }, { status: 403 });
  }

  const users = await db.user.findMany({
    where: { workspaceId: session.user.workspaceId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users.map(toTeamMemberDTO));
}

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["ADMIN", "ANALYST", "VIEWER"]),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Only admins can add members." }, { status: 403 });
  }

  const parsed = inviteSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Please enter a valid email and role." }, { status: 400 });
  }
  const { email, role } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { message: "A user with this email already exists." },
      { status: 409 }
    );
  }

  // No email delivery in scope: generate a temporary password the admin
  // shares manually. Only the hash is stored; the plain text is returned once.
  const temporaryPassword = randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const user = await db.user.create({
    data: {
      name: email.split("@")[0],
      email,
      passwordHash,
      role,
      workspaceId: session.user.workspaceId, // always the admin's own workspace
    },
  });

  return NextResponse.json({ ...toTeamMemberDTO(user), temporaryPassword }, { status: 201 });
}