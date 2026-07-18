import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Orbit Event ERP",
    template: "%s | Orbit Event ERP",
  },
  description:
    "Orbit Event ERP — the operating system for modern events. Registration, badges, QR check-in, food coupons, exhibitors and analytics on one platform.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} bg-surface font-sans text-[0.875rem] text-slate-700`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
