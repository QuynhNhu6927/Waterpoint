import type { Metadata } from "next";
import "./globals.css";

/* URL goc cua site (dung de dung link tuyet doi cho OG image khi share).
   Khi deploy len that, set bien moi truong NEXT_PUBLIC_SITE_URL,
   vd: https://waterpoint.era.vn */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:1236";

const SITE_TITLE = "Waterpoint - ERA Vietnam";
const SITE_DESCRIPTION =
  "Waterpoint - khu đô thị bên sông Vàm Cỏ, Bến Lức, Long An. ";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Waterpoint - ERA Vietnam",
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: SITE_TITLE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    /* Anh OG that (public/img_og.jpg) */
    images: [
      {
        url: "/img_og.jpg",
        width: 1493,
        height: 747,
        alt: "Waterpoint City - ERA Vietnam",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/img_og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
