import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BusyProvider } from "@/hooks/useBusyState";
import { NavBar } from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AIC Config Pipeline",
  description: "Ping Advanced Identity Cloud Configuration Pipeline UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50">
        <BusyProvider>
          <NavBar />
          <main className="px-6 sm:px-10 lg:px-16 py-8 w-full">
            {children}
          </main>
        </BusyProvider>
      </body>
    </html>
  );
}
