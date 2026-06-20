import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { TRACKED_PROVIDER_COUNT } from "@/lib/providers-config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "PeptideSearch Pro — Compare Peptide Prices Across Tracked Suppliers",
  description:
    `Search and compare research peptide prices across ${TRACKED_PROVIDER_COUNT} tracked suppliers including VPR Members Club. Find the best deals on BPC-157, Semaglutide, Tirzepatide, and more.`,
  keywords: [
    "peptide search",
    "peptide price comparison",
    "research peptides",
    "BPC-157 price",
    "semaglutide price",
    "tirzepatide price",
  ],
  openGraph: {
    title: "PeptideSearch Pro",
    description: "Compare peptide prices across every major research supplier.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
