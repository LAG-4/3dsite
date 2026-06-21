import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#11100f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "Jo Mendes — NomadaToast",
  description: "Practical AI tutorials for creators who want to grow, ship, and monetise.",
  openGraph: {
    title: "Jo Mendes — NomadaToast",
    description: "Practical AI tutorials for creators who want to grow, ship, and monetise.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jo Mendes — NomadaToast",
    description: "Practical AI tutorials for creators who want to grow, ship, and monetise.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={interTight.variable}>
      <body style={{ fontFamily: "var(--font-inter-tight), Arial, sans-serif" }}>{children}</body>
    </html>
  );
}
