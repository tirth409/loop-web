import type { Theme } from "@/lib/types";
import { apiClient } from "@/lib/api/client";

export async function getThemes(): Promise<Theme[]> {
  return apiClient.get<Theme[]>("/themes");
}

export async function getThemeById(id: string): Promise<Theme> {
  const themes = await getThemes();
  const theme = themes.find((t) => t.id === id);
  if (!theme) throw new Error("Theme not found");
  return theme;
}