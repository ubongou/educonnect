import type { Metadata } from "next";
import { Nunito, Nunito_Sans } from "next/font/google";
import "./globals.css";

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
    <html lang="en" className={`${nunito.variable} ${nunitoSans.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans text-navy bg-white antialiased">
        {children}
      </body>
    </html>
  );
}
