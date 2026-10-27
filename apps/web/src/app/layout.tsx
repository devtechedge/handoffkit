import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://handoffkit-seven.vercel.app";
const description =
  "Turn an exported n8n workflow into a client-ready handover pack: readiness checks, an AI register, a data and credential map, a runbook, a share link and a PDF.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "HandoffKit | Client-ready handover packs for automation agencies",
    template: "%s | HandoffKit",
  },
  description,
  applicationName: "HandoffKit",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "HandoffKit",
    description,
    type: "website",
    siteName: "HandoffKit",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "HandoffKit",
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b6f68",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
