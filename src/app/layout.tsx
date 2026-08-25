import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, JetBrains_Mono } from "next/font/google";
import { AppNav } from "@/components/AppNav";
import { Providers } from "@/components/Providers";
import "./globals.css";

const display = Bebas_Neue({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Man United Fan House League",
  description:
    "FPL Classic + H2H analytics, earnings tracker, and payouts for the Man United Fan House League.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink text-foreground">
        <Providers>
          <AppNav />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/10 py-6 text-center text-xs text-white/40">
            Man United Fan House League ·{" "}
            <a href="/rules" className="text-gold/80 hover:text-gold">
              Rules
            </a>{" "}
            · Not affiliated with Manchester United or the Premier League · GGMU
          </footer>
        </Providers>
      </body>
    </html>
  );
}
