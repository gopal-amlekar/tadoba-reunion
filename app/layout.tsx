import type { Metadata } from "next";
import { Baloo_2, Inter } from "next/font/google";
import Link from "next/link";
import JungleBackdrop from "@/components/JungleBackdrop";
import { EVENT } from "@/lib/event";
import { getRole } from "@/lib/auth";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin", "devanagari"],
  variable: "--font-baloo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${EVENT.name} ${EVENT.year}`,
  description: `${EVENT.tagline} ${EVENT.mainDays} at ${EVENT.venue}.`,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getRole();

  return (
    <html lang="en" className={`${baloo.variable} ${inter.variable}`}>
      <body className="min-h-screen">
        <JungleBackdrop />

        <header className="no-print sticky top-0 z-50 border-b border-jungle-800/80 bg-jungle-950/80 backdrop-blur-md">
          <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4">
            <Link
              href="/"
              className="font-display text-lg font-bold text-bone transition hover:text-tiger"
            >
              🐯 {EVENT.name}
            </Link>
            <span className="ml-auto flex items-center gap-1 text-sm sm:gap-3">
              {role && (
                <Link
                  href="/travel"
                  className="rounded-lg px-2 py-1.5 text-bone-dim transition hover:bg-jungle-800 hover:text-leaf sm:px-3"
                >
                  Travel list
                </Link>
              )}
              {role === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-lg px-2 py-1.5 text-amber-glow transition hover:bg-jungle-800 sm:px-3"
                >
                  Logistics
                </Link>
              )}
              {!role && (
                <Link href="/unlock" className="btn-primary !px-4 !py-1.5 text-sm">
                  Enter details
                </Link>
              )}
            </span>
          </nav>
        </header>

        <main>{children}</main>

        <footer className="no-print mt-20 border-t border-jungle-800 py-8 text-center text-sm text-bone-dim">
          <p>
            {EVENT.name} {EVENT.year} · {EVENT.mainDays}
          </p>
          <p className="mt-1">
            Organised by {EVENT.organiser}. Made with chai and nostalgia.
          </p>
        </footer>
      </body>
    </html>
  );
}
