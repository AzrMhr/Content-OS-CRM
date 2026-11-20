import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Content CRM",
  description: "Creator roster and content pipeline for a UGC ecommerce brand.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className:
                "!bg-surface !text-ink-900 !border !border-ink-100 !rounded-xl !text-sm",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
