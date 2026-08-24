import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coding Shaft Lead Intelligence Engine",
  description:
    "AI-assisted B2B prospect discovery, public footprint audit, reputation insights, and evidence-backed sales qualification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-slate-950 text-slate-100 min-h-screen">
        <div className="relative min-h-screen flex flex-col">
          {/* Ambient Background Gradient Glows */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          </div>

          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
