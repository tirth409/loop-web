import type { Report, GenerateReportPayload } from "@/lib/types";
import { apiClient } from "@/lib/api/client";

export async function getReports(): Promise<Report[]> {
  return apiClient.get<Report[]>("/reports");
}

export async function getReportById(id: string): Promise<Report> {
  return apiClient.get<Report>(`/reports/${id}`);
}

export async function generateReport(
  payload: GenerateReportPayload
): Promise<Report> {
  return apiClient.post<Report>("/reports", payload);
}