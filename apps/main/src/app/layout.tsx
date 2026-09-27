import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saruku State — Second Session",
  description: "A snapshot of current state, personality, social connections, and active rooms.",
  icons: {
    icon: "/assets/icon.png",
    apple: "/assets/icon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
