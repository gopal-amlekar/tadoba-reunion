import type { Metadata } from "next";
import { Baloo_2, Inter } from "next/font/google";
import JungleBackdrop from "@/components/JungleBackdrop";
import { EVENT } from "@/lib/event";
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
  // Needed so the share-preview image resolves to an absolute URL.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://tadoba-reunion.vercel.app",
  ),
  title: `ताडोबा रीयुनियन ${EVENT.year} · ${EVENT.name} ${EVENT.year}`,
  description: `ताडोबा बोलवतंय, चला रे! Tadoba is calling us back — ${EVENT.mainDays}.`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mr" className={`${baloo.variable} ${inter.variable}`}>
      <body className="min-h-screen">
        <JungleBackdrop />
        <main>{children}</main>
        <footer className="mt-20 border-t border-jungle-800 py-8 text-center text-sm text-bone-dim">
          <p>
            ताडोबा रीयुनियन {EVENT.year} · Tadoba Reunion {EVENT.year}
          </p>
          <p className="mt-1">
            चहा आणि आठवणींसोबत बनवलेलं · Made with chai and nostalgia.
          </p>
        </footer>
      </body>
    </html>
  );
}
