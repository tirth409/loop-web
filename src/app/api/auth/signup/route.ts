import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  workspaceName: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, password, workspaceName } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { message: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const workspace = await db.workspace.create({ data: { name: workspaceName } });

  await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "ADMIN",
      workspaceId: workspace.id,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}