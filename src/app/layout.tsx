import type { Metadata } from "next";
import { Nunito, Nunito_Sans, Outfit, Inter } from "next/font/google";
import "./globals.css";
import "../styles/marketing.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-nunito-sans",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EduConnect | Personal Tutoring from Nigeria's Best Teachers",
  description:
    "EduConnect — Personal Tutoring from Nigeria's Best Teachers. One-on-one sessions in Maths, English, and Science. Backed by MIT.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${nunitoSans.variable} ${outfit.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans text-navy bg-white antialiased">
        {children}
      </body>
    </html>
  );
}
