"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  Trophy,
  LayoutDashboard,
  Vote,
  Wallet as WalletIcon,
} from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { useUIStore } from "@/hooks/use-ui-store"

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { isConnected } = useWallet()
  const openWalletConnect = useUIStore((s) => s.openWalletConnect)

  const items = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Trophy, label: "Matches", href: "/#" },
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Vote, label: "Voting", href: "/voting" },
  ]

  const handleWalletClick = () => {
    if (isConnected) {
      // Already connected — go to dashboard
      router.push("/dashboard")
    } else {
      // Open the singleton WalletConnectModal mounted in app/layout.tsx
      openWalletConnect()
    }
  }

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 w-full md:hidden z-50 bg-background/95 backdrop-blur-md border-t border-primary/30 flex justify-around items-center py-2"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {items.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href 

        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="flex flex-col items-center justify-center flex-1 group min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md py-1"
          >
            <Icon
              className={`h-6 w-6 transition-all duration-300 motion-reduce:transition-none ${
                active
                  ? "text-primary glow-cyan scale-110"
                  : "text-muted-foreground group-hover:text-primary scale-100"
              }`}
            />
            <span
              className={`text-xs mt-1 transition-all duration-300 motion-reduce:transition-none ${
                active
                  ? "text-primary opacity-100"
                  : " group-hover:opacity-100 text-muted-foreground"
              }`}
            >
              {item.label}
            </span>
          </Link>
        )
      })}

      <button
        type="button"
        aria-label={isConnected ? "Open wallet dashboard" : "Connect wallet"}
        onClick={handleWalletClick}
        className={`flex flex-col items-center flex-1 group min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md py-1 ${
          isConnected ? "text-primary" : ""
        }`}
      >
        <WalletIcon
          className={`h-6 w-6 transition-all motion-reduce:transition-none ${
            isConnected
              ? "text-primary glow-cyan"
              : "text-muted-foreground group-hover:text-primary"
          }`}
        />
        <span
          className={`text-xs mt-1 ${
            isConnected
              ? "text-primary"
              : "text-muted-foreground group-hover:text-primary"
          }`}
        >
          Wallet
        </span>
      </button>
    </nav>
  )
}
