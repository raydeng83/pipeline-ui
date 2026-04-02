import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

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
      <body className="min-h-full flex flex-col bg-slate-50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-6">
                <Link href="/" className="font-semibold text-slate-900 text-sm">
                  AIC Config Pipeline
                </Link>
                <nav className="flex items-center gap-1">
                  <Link href="/" className="px-3 py-1.5 rounded text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                    Dashboard
                  </Link>
                  <Link href="/pull" className="px-3 py-1.5 rounded text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                    Pull
                  </Link>
                  <Link href="/push" className="px-3 py-1.5 rounded text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                    Push
                  </Link>
                  <Link href="/promote" className="px-3 py-1.5 rounded text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                    Promote
                  </Link>
                  <Link href="/configs" className="px-3 py-1.5 rounded text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                    Configs
                  </Link>
                  <Link href="/environments" className="px-3 py-1.5 rounded text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                    Environments
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
