import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mellvitta AI",
  description: "Mellvitta AI - Convert Long Video to Short Viral Clips in minutes. AI content automation tool",
  icons: {
    icon: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <Script
  id="open-in-chrome"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      const ua = navigator.userAgent || '';
      const isInApp = /Instagram|FBAN|FBAV|Messenger|Twitter|WhatsApp|Telegram/i.test(ua);
      if (isInApp) {
        const url = window.location.href.replace(/^https?:\\/\\//, '');
        window.location = 'intent://' + url + '#Intent;scheme=https;package=com.android.chrome;end';
      }
    `,
  }}
/>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
