import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import DataPrefetcher from "@/components/DataPrefetcher";
import { Toaster } from "sonner";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Improves loading performance
  preload: true, // Explicitly enable preloading
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Improves loading performance
  preload: true, // Explicitly enable preloading
});

export const metadata: Metadata = {
  title: "Amethyst Inn",
  description: "Guest House",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
    <body
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <DataPrefetcher />
        {children}
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </body>
    </html>
  );
}
