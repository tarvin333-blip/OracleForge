import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import AuthStatus from "@/components/AuthStatus"; // Import the new component

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Oracle Forge",
  description: "Create, share, and use your own digital divination decks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <div className="relative min-h-screen bg-grid-white/[0.05]">
          <header className="p-4 flex justify-between items-center border-b border-gray-800">
            <Link href="/" className="text-2xl font-bold hover:text-indigo-400 transition-colors">
              Oracle Forge
            </Link>
            <nav className="flex gap-6 items-center">
              <Link href="/studio" className="text-gray-300 hover:text-white transition-colors">Creator&apos;s Studio</Link>
              <Link href="/reading-room" className="text-gray-300 hover:text-white transition-colors">Reading Room</Link>
              <Link href="/marketplace" className="text-gray-300 hover:text-white transition-colors">Marketplace</Link>
              <AuthStatus /> {/* Replace the static buttons with the dynamic component */}
            </nav>
          </header>
          <main className="p-4">
            {children}
          </main>
          <footer className="p-4 text-center text-xs text-gray-500 border-t border-gray-800">
            <p>&copy; 2024 Oracle Forge. All rights reserved.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
