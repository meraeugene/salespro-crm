import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://salespro-crm.local"),
  title: {
    default: "SalesPro CRM | Sales Pipeline and Revenue Dashboard",
    template: "%s | SalesPro CRM",
  },
  description:
    "SalesPro CRM helps sales teams manage companies, leads, contacts, deals, tasks, notifications, and revenue analytics in one focused workspace.",
  applicationName: "SalesPro CRM",
  keywords: [
    "CRM",
    "sales CRM",
    "lead management",
    "deal pipeline",
    "sales dashboard",
    "sales analytics",
  ],
  authors: [{ name: "SalesPro CRM" }],
  creator: "SalesPro CRM",
  publisher: "SalesPro CRM",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "SalesPro CRM",
    title: "SalesPro CRM | Sales Pipeline and Revenue Dashboard",
    description:
      "Manage companies, leads, contacts, deals, tasks, notifications, and revenue analytics from one CRM workspace.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SalesPro CRM | Sales Pipeline and Revenue Dashboard",
    description:
      "A focused CRM workspace for lead management, deal tracking, sales tasks, and revenue analytics.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
