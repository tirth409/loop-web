import type { DashboardData } from "@/lib/types";
import { mockDashboardData } from "@/lib/mock/data";

export async function getDashboardData(_dateRange?: {
  from: string;
  to: string;
}): Promise<DashboardData> {
  await new Promise((r) => setTimeout(r, 600));
  return mockDashboardData;
}
