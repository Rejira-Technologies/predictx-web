"use client"

import Link from "next/link"
import { WalletButton } from "../wallet-button"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "../ui/button"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "../ui/dialog"
import { t } from "@/lib/i18n"

const navigation = [
  { name: "Home", key: "nav.home", href: "/" },
  { name: "Dashboard", key: "nav.dashboard", href: "/dashboard" },
  { name: "Voting", key: "nav.voting", href: "/voting", badge: 3 },
  { name: "How It Works", key: "nav.howItWorks", href: "/how-it-works" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-primary/20">

        <nav aria-label="Main" className="mx-auto flex max-w-7xl items-center justify-between p-4">

          {/* Logo */}
          <Link href="/" className="font-display text-xl sm:text-2xl text-primary text-glow-cyan font-bold">
            PredictX
          </Link>


          {/* Desktop Nav */}
          <div className="hidden md:flex gap-8">

            {navigation.map((item) => {

              const isActive = pathname === item.href

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="relative text-sm font-bold"
                  aria-current={isActive ? "page" : undefined}
                >

                  {t(item.key)}

                  {item.badge && (
                    <span className="ml-2 text-xs bg-primary text-black px-1 rounded">
                      {item.badge}
                    </span>
                  )}

                  {isActive && (
                    <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-primary glow-cyan"/>
                  )}

                </Link>
              )
            })}

          </div>

          <div className="flex gap-4 items-center">

            <WalletButton />

            <Button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              aria-haspopup="dialog"
            >
              <Menu />
            </Button>

          </div>

        </nav>

      </header>
      {/* Radix Dialog supplies the focus trap, Escape handling, scroll lock,
          aria-modal and focus restoration to the menu trigger. */}
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="top-0 left-0 translate-x-0 translate-y-0 max-w-none sm:max-w-none w-full h-dvh rounded-none border-0 p-0 shadow-none bg-black flex flex-col items-center justify-center gap-0 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100"
          style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <DialogTitle className="sr-only">Navigation menu</DialogTitle>

          <DialogClose asChild>
            <Button
              className="absolute top-6 right-6 min-h-[44px] min-w-[44px]"
              aria-label="Close menu"
            >
              <X />
            </Button>
          </DialogClose>

          <nav aria-label="Mobile" className="flex flex-col items-center">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={pathname === item.href ? "page" : undefined}
                className="text-2xl py-4 min-h-[64px] flex items-center"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <WalletButton />
        </DialogContent>
      </Dialog>
    </>
  )
}
