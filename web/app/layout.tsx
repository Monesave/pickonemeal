import "./globals.css";
import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";

export const metadata = {
  title: 'pickonemeal.com',
  description: 'Swipe together. Decide dinner fast.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}


