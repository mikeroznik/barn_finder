import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Header } from "@/components/Header";
import { UnitsProvider, UnitsToggle } from "@/components/UnitsProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Barn Finder", template: "%s · Barn Finder" },
  description: "Find ice rinks for hockey: sheets, seating, parking, amenities, reviews and nearby places.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#131c2e" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <UnitsProvider>
          <Header />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5">{children}</main>
          <footer className="border-t border-border">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 text-xs text-muted">
              <p>
                Map data ©{" "}
                <a className="link" href="https://www.openstreetmap.org/copyright">
                  OpenStreetMap
                </a>{" "}
                contributors
              </p>
              <UnitsToggle />
            </div>
          </footer>
        </UnitsProvider>
      </body>
    </html>
  );
}
