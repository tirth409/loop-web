import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { toReportDTO } from "@/lib/mappers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Tenant isolation: the id alone is never enough.
  const report = await db.report.findFirst({
    where: { id: params.id, workspaceId: session.user.workspaceId },
    include: { generatedBy: { select: { name: true } } },
  });
  if (!report) {
    return NextResponse.json({ message: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(toReportDTO(report));
}