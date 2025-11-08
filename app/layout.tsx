import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "astrinn",
  description: "Secure photo storage",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
