import { HowItWorksContent } from "@/components/how-it-works-content"

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen relative overflow-hidden">

      {/* Section 1: Page Hero */}
      <div className="relative pt-20 pb-16 md:pt-32 md:pb-24 border-b border-primary/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,249,0.05)_0%,transparent_70%)]" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8 relative z-10 text-center">
          <h1 className="font-display text-6xl md:text-8xl font-black uppercase text-primary text-glow-cyan mb-6 tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-700">
            HOW IT WORKS
          </h1>
          <p className="text-muted-foreground text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 delay-200 duration-700">
            From prediction to payout — everything you need to know
          </p>

          <div className="mt-12 flex justify-center animate-in fade-in zoom-in delay-500 duration-1000">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full" />
              <div className="relative w-24 h-24 md:w-32 md:h-32 bg-background border-2 border-primary/50 rounded-2xl flex items-center justify-center rotate-12 glow-cyan">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-xl flex items-center justify-center -rotate-12">
                  <span className="text-4xl md:text-6xl">🔮</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-20 lg:px-8 relative z-10">
        <HowItWorksContent />
      </div>
    </main>
  )
}
