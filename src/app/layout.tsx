import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";

import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "LOOP — AI Customer Feedback Intelligence",
    template: "%s | LOOP",
  },
  description:
    "LOOP is a corporate-grade AI customer feedback intelligence platform. Manage feedback, track trends, and generate Voice-of-Customer reports.",
  keywords: ["customer feedback", "AI analytics", "voice of customer", "feedback management"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <SessionProvider>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                fontSize: "13px",
              },
            }}
          />
        </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
