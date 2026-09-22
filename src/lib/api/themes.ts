import type { Theme } from "@/lib/types";
import { mockThemes } from "@/lib/mock/data";

export async function getThemes(): Promise<Theme[]> {
  await new Promise((r) => setTimeout(r, 500));
  return mockThemes;
}

export async function getThemeById(id: string): Promise<Theme> {
  await new Promise((r) => setTimeout(r, 300));
  const theme = mockThemes.find((t) => t.id === id);
  if (!theme) throw new Error("Theme not found");
  return theme;
}
