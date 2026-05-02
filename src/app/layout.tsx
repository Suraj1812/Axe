import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
const title = "Axe - 3D Website Builder";
const description =
  "A no-code 3D WebGL website builder for designing interactive Three.js websites with visual editing, animation timelines, and save/load workflows.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "Axe",
  title: {
    default: title,
    template: "%s | Axe",
  },
  description,
  keywords: [
    "Axe",
    "3D website builder",
    "WebGL editor",
    "Three.js builder",
    "no-code 3D",
    "interactive websites",
  ],
  authors: [{ name: "Axe" }],
  creator: "Axe",
  publisher: "Axe",
  category: "design",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml", sizes: "any" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml", sizes: "any" }],
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Axe",
    title,
    description,
    images: [
      {
        url: "/axe-og.svg",
        width: 1200,
        height: 630,
        alt: "Axe 3D Website Builder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/axe-og.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#08090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#08090b] text-zinc-100">
        {children}
      </body>
    </html>
  );
}
