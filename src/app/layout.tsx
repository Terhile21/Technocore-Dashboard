import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { SessionGuard } from "@/components/layout/SessionGuard";

export const metadata: Metadata = {
  title: "Technocore Dashboard",
  description: "A secure client-side dashboard for Technocore identities and activity.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col"><SessionGuard><AppShell>{children}</AppShell></SessionGuard></body>
    </html>
  );
}
