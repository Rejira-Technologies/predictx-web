import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";
import { GlowCard } from "@/components/shared/glow-card";
import { GamingButton } from "@/components/shared/gaming-button";

export default function NotFound() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4">
      <GlowCard variant="default" className="max-w-md w-full text-center">
        <div className="relative z-20 p-8 space-y-4">
          {/* 404 display */}
          <div className="font-display text-7xl font-black text-primary/30 text-glow-cyan select-none">
            404
          </div>

          <Search className="h-10 w-10 mx-auto text-primary" />

          <h1 className="font-display text-2xl font-black uppercase text-foreground">
            Page Not Found
          </h1>

          <p className="text-sm text-muted-foreground">
            The match, poll, or page you&apos;re looking for doesn&apos;t exist
            or has been removed.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/">
              <GamingButton variant="primary" size="md">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </GamingButton>
            </Link>
            <Link href="/dashboard">
              <GamingButton variant="ghost" size="md">
                My Dashboard
              </GamingButton>
            </Link>
          </div>
        </div>
      </GlowCard>
    </main>
  );
}
