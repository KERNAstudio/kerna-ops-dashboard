import type { Metadata } from "next";
import { Work_Sans, JetBrains_Mono, Newsreader } from "next/font/google";
import "./globals.css";

// §6 Premium Utilitarian Minimalism: Work Sans (primary sans, replaces Montserrat),
// JetBrains Mono (data/tabular/timestamps, replaces Inter in that role), Newsreader
// (editorial serif, page titles only — new, no prior equivalent).
const workSans = Work_Sans({
  variable: "--font-worksans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jbMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["italic"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "KERNA Ops Dashboard",
  description: "Internal client-delivery platform for KERNA",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${workSans.variable} ${jbMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-main text-primary font-sans">
        {children}
      </body>
    </html>
  );
}
