import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import DataPrefetcher from "@/components/common/data-prefetcher";
import { Toaster } from "sonner";
import { SpeedInsights } from "@vercel/speed-insights/next"; 



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
  icons: {
    icon: '/favicon.ico',
  },
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
          enableSystem={true}
          disableTransitionOnChange
        >
          <DataPrefetcher />
          {children}
          <SpeedInsights />
          <Toaster
            position="top-left"
            richColors
            toastOptions={{
              style: {
                background: "var(--background)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              },
              className: "sonner-toast",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
