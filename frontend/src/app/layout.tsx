import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DocuMind — AI Document Assistant",
  description: "Ask questions about your documents with source citations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} h-full bg-gray-50 dark:bg-[#111111]`}>
        {children}
      </body>
    </html>
  );
}
