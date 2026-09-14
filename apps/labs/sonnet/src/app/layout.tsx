import type { Metadata } from "next";
import type { ReactNode } from "react";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";
export const metadata:Metadata={title:"Sonnet Mission — Second Session",description:"Follow Saruku’s public progress through the Sonnet Challenge."};
export default function Layout({children}:{children:ReactNode}){return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:THEME_SCRIPT}}/></head><body>{children}</body></html>}
