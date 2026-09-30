import type React from "react"
import type { Metadata } from "next"
import { Orbitron, Barlow, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

import { Toaster } from "@/components/ui/sonner"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import { Header } from "@/components/layout/Header"
import { HudBar } from "@/components/layout/hud-bar"
import { PageTransition } from "@/components/layout/page-transition"
import { ErrorHandlerMount } from "@/components/shared/error-handler-mount"
import { WalletConnectModalRoot } from "@/components/wallet-connect-modal-root"


// Display font - bold, all-caps, aggressive
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-display",
})

// Body text - clean geometric sans-serif
const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
})

// Numbers/Stats - digital/tech feel
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "PredictX - Web3 Football Prediction Markets",
  description: "Stake on football match events, vote on outcomes, and win proportional rewards from the pool",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${orbitron.variable} ${barlow.variable} ${jetbrainsMono.variable} font-body antialiased`}
        style={{
          backgroundImage: `linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%)`,
          minHeight: "100vh",
        }}>

        {/* Header is fixed top-0 (h-16). HUD bar sits just below it on desktop. */}
        <Header />
        {/* HudBar handles both desktop (fixed below header) and mobile (fixed above bottom nav) */}
        <HudBar />

        {/* Content: pad for fixed header (4rem = h-16) on all breakpoints */}
        <div className="pt-16 pb-16 md:pb-0" />
        <PageTransition>
          {children}
        </PageTransition>
        <ErrorHandlerMount />
        <Toaster theme="dark" position="bottom-right" />
        <Analytics />
        <MobileBottomNav />

        {/*
          Single WalletConnectModal instance for the entire app.
          Open it from anywhere via: useUIStore.getState().openWalletConnect()
          This prevents duplicate dialog roots and fragmented focus management.
        */}
        <WalletConnectModalRoot />
      </body>
    </html>
  )
}
