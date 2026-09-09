import type { Metadata } from "next";
import type { ReactNode } from "react";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = { title: "Intent — Second Session", description: "A quiet glimpse into Saruku’s thoughts about life and the world." };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
    <body><div className="landscape" aria-hidden="true"><div className="day-sky" /><div className="night-sky" /><div className="cloud cloud-one" /><div className="cloud cloud-two" /><div className="stars" /><div className="hill hill-back" /><div className="hill hill-front" /><div className="leaf leaf-one" /><div className="leaf leaf-two" /></div>{children}</body>
  </html>;
}
