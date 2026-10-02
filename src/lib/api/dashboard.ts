import type { DashboardData } from "@/lib/types";
import { apiClient } from "@/lib/api/client";

export async function getDashboardData(days = 30): Promise<DashboardData> {
  return apiClient.get<DashboardData>(`/dashboard?days=${days}`);
}