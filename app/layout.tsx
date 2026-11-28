import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { cookies } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import { htmlClassFor, parseTheme, THEME_COOKIE } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "LeaveTrack", template: "%s · LeaveTrack" },
  description: "Request leave, check your balance, and approve your team's time off.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // TASK-047: the browser chrome follows the theme (system preference for "system").
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "hsl(174 72% 26%)" },
    { media: "(prefers-color-scheme: dark)", color: "hsl(222 30% 9%)" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // TASK-047: the theme class is rendered on the server from the lt-theme cookie — no flash, no
  // script. Validated: anything unexpected means "system" (no class).
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${htmlClassFor(theme)}`.trim()}
    >
      <body className="min-h-dvh">
        {children}
        <Toaster position="top-center" richColors closeButton theme={theme} />
      </body>
    </html>
  );
}
