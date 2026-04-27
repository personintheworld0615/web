import type { Metadata } from "next";
import { Newsreader, Space_Mono } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: "italic",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "BSA Workbook Generator",
  description: "AI-powered Merit Badge workbooks for Scouts",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

import { Analytics } from "@vercel/analytics/next";
import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(newsreader.variable, spaceMono.variable)}>
      <body className="antialiased font-sans">
        <Navbar />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
