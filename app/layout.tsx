import type { Metadata } from "next";
import { Instrument_Serif, Hanken_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Boy Scout Workbooks & Merit Badge Workbook List | PDF & DOCX",
  description: "Generate free, fillable Boy Scout workbooks for any merit badge. Browse our complete merit badge workbook list and create custom PDFs or DOCX files instantly.",
  alternates: {
    canonical: "https://bsaworkbooks.com",
  },
  openGraph: {
    title: "Boy Scout Workbooks & Merit Badge Workbook List | PDF & DOCX",
    description: "Generate free, fillable Boy Scout workbooks for any merit badge. Browse our complete merit badge workbook list and create custom PDFs or DOCX files instantly.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/badge_icon.png",
        width: 1200,
        height: 630,
        alt: "BSA Merit Badge Workbook Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Boy Scout Workbooks & Merit Badge Workbook List",
    description: "Generate free, fillable Boy Scout workbooks for any merit badge. Browse our complete merit badge workbook list.",
    images: ["/badge_icon.png"],
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  verification: {
    google: "_V_ZtR-JZGE2Inw5RctVilnjFSd4Em4tLzIIrvT69dA",
  },
};

import { Analytics } from "@vercel/analytics/next";
import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schemaData = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "BSA Merit Badge Workbook Generator",
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "All",
      "description": "Generate instant, fillable PDF and DOCX Merit Badge workbooks using AI. Simply paste your BSA scout requirements and download your free workbook.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://bsaworkbooks.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Library",
          "item": "https://bsaworkbooks.com/library"
        }
      ]
    }
  ];

  return (
    <html lang="en" className={cn(instrumentSerif.variable, hankenGrotesk.variable, spaceMono.variable)}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </head>
      <body className="antialiased font-sans">
        <Navbar />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
