import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Mohammed Salha - Full-Stack Developer",
  description:
    "Premium bilingual portfolio for Mohammed Salha, full-stack developer specializing in Salla and Arabic web experiences."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={jetbrains.variable}>
        {children}
        {/* Real-visitor Core Web Vitals: the LCP budget is judged on this field data (D-024). */}
        <SpeedInsights />
      </body>
    </html>
  );
}
