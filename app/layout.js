import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MiniAppProvider } from "./contexts/MiniAppContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "DeScAi - AI Research Paper Reviewer",
  description: "Generate comprehensive peer reviews of research papers using AI.",
  other: {
    'fc:miniapp': JSON.stringify({
      version: "next",
      imageUrl: "https://your-domain-placeholder.vercel.app/miniapp/hero.svg",
      button: {
        title: "Analyze Papers",
        action: {
          type: "launch_miniapp",
          name: "DeScAi",
          url: "https://your-domain-placeholder.vercel.app"
        }
      }
    })
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <MiniAppProvider>
          {children}
        </MiniAppProvider>
      </body>
    </html>
  );
}
