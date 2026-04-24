import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "קורס CBT | טיפול קוגניטיבי-התנהגותי",
  description: "קורס מקצועי ב-CBT — 12 מפגשים עם תרגול מעשי ומשוב AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="font-heebo antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
