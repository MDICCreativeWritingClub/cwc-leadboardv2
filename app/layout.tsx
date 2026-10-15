import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manarat CWC",
  description: "Embellish your creativity!",
};

// Three-role typography, defined as CSS variables with system/web-safe
// stacks. No external font fetch, so it can never fail at build time
// regardless of network conditions on the build host.
//   --font-display: headlines, the masthead, section titles
//   --font-reading: long-form story/poem body copy
//   --font-ui:      nav, buttons, labels, forms
const fontVars: React.CSSProperties = {
  ["--font-display" as string]:
    "Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', serif",
  ["--font-reading" as string]:
    "Charter, 'Iowan Old Style', Georgia, 'Times New Roman', serif",
  ["--font-ui" as string]:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={fontVars} suppressHydrationWarning>
      <body style={{ fontFamily: "var(--font-ui)" }} suppressHydrationWarning>
        <Providers>
          <div className="bg-background text-foreground min-h-dvh">
            <Navbar />
            <main>{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
