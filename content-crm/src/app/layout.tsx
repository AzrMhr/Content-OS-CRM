import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Content CRM",
  description: "Creator roster and content pipeline for a UGC ecommerce brand.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
