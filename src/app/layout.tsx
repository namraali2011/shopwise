
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShopWise | Smart E-Commerce Support",
  description:
    "A database-powered, rule-based e-commerce customer support chatbot built with Next.js and Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
