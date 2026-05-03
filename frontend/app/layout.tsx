import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Echo Chamber AI",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
  description:
    "An interactive exploration of Knockin' on Heaven's Door covers across decades — AI-powered emotional analysis, historical context, and personal farewell matching.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="film-grain">{children}</body>
    </html>
  );
}
