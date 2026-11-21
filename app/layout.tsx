import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import {
  Bricolage_Grotesque,
  Fraunces,
  Fredoka,
  Geist,
  Geist_Mono,
  Orbitron,
  Pixelify_Sans,
} from "next/font/google";
import { ThemeProvider } from "next-themes";
import { LavaBackground } from "@/components/lava-background";
import { ThemeEffects } from "@/components/theme-effects";
import { ThemeScene } from "@/components/theme-scene";
import { Toaster } from "@/components/ui/sonner";
import { PREFS_COOKIE, htmlAttributes, parsePreferencesCookie } from "@/lib/preferences";
import "./globals.css";
import "./themes.css";
import "./theme-extras.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });
const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"], preload: false });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], preload: false });
const pixelify = Pixelify_Sans({ variable: "--font-pixelify", subsets: ["latin"], preload: false });
// font cyberpunk del tema Neon
const orbitron = Orbitron({ variable: "--font-orbitron", subsets: ["latin"], preload: false });

const fontVars = [geistSans, geistMono, bricolage, fredoka, fraunces, pixelify, orbitron]
  .map((f) => f.variable)
  .join(" ");

export const metadata: Metadata = {
  title: { default: "Cim Ranking", template: "%s · Cim Ranking" },
  description: "Classifiche, vittorie e corone per le serate di giochi da tavolo.",
};

export const viewport: Viewport = {
  themeColor: "#0b1520",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const prefs = parsePreferencesCookie((await cookies()).get(PREFS_COOKIE)?.value);

  return (
    <html
      lang="it"
      suppressHydrationWarning
      className={`${fontVars} dark h-full antialiased`}
      {...htmlAttributes(prefs)}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" forcedTheme="dark" disableTransitionOnChange>
          <LavaBackground />
          <ThemeScene />
          <ThemeEffects />
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
