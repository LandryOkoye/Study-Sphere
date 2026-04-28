import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BentoBox, BentoGrid } from "@/components/ui/bento-box";
import { BookOpenText, Sparkles, FolderCog, Network, TrendingUp, GraduationCap, ChevronRight } from "lucide-react";import Pricing from "@/components/pricing";
import Threads from "@/components/ui/Threads";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-obsidian flex flex-col font-sans selection:bg-charcoal selection:text-foreground">
      {/* Header */}
      <header className="border-b border-charcoal/50 bg-obsidian/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="StudySphere Logo" width={24} height={24} priority />
            <span className="font-bold tracking-tight text-lg">StudySphere</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-foreground/70">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth">
              <Button size="sm" className="rounded-sm">
                <div className="w-4 h-4" />
                Get Started
                <div className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-20 w-full flex flex-col gap-24">

        {/* Hero Section */}
        <section className="relative w-full min-h-[500px] flex flex-col justify-center">
          <div className="absolute inset-0 z-0 opacity-40 pointer-events-none md:pointer-events-auto -mx-6 md:-mx-0">
            <Threads amplitude={1} distance={0} enableMouseInteraction />
          </div>
          
          <div className="relative z-10 flex flex-col gap-6 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-charcoal bg-charcoal/20 w-fit rounded-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></span>
              {/* <span className="text-xs font-mono text-accent-green">0G Node Operational: 12ms ping</span> */}
              <span className="text-xs font-mono text-accent-green">0G Network</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.1]">
              Decentralized <br className="hidden md:block" />
              <span className="text-foreground/60">Structured Learning.</span>
            </h1>
            {/* <p className="text-lg md:text-xl text-foreground/70 max-w-2xl leading-relaxed mt-4">
              StudySphere maps AI-generated content strictly to recognized textbook outlines.
              Powered by ZeroGravity decentralized compute and storage.
            </p> */}
            <p className="text-lg md:text-1xl text-foreground/70 max-w-2xl leading-relaxed mt-4">
              Personalized learning for students and researchers. Study smarter, not harder with tools designed for deep focus and academic excellence.
            </p>
            <div className="flex items-center gap-4 mt-8">
              <Link href="/auth">
                <Button size="lg" className="rounded-sm flex items-center gap-2">
                  Get Started <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="rounded-sm">
                  Features
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="scroll-mt-24 w-full flex flex-col gap-10">
          <div className="flex flex-col gap-4 max-w-3xl mb-4">
            <div className="inline-flex items-center px-3 py-1 bg-charcoal/40 rounded-full w-fit">
              <span className="text-[10px] font-mono text-accent-blue uppercase tracking-widest font-semibold">
                Core Infrastructure
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
              Curriculum-Aligned AI
            </h2>
            <p className="text-foreground/70 text-lg leading-relaxed mt-2">
              An environment that maps perfectly to your textbooks. Our AI doesn't just answer; it understands the pedagogical context of your specific curriculum.
            </p>
          </div>

          <BentoGrid className="md:grid-cols-3 gap-4">
            {/* Card 1 - Main */}
            <BentoBox className="md:col-span-2 md:row-span-2 flex flex-col justify-between min-h-[300px]">
              <div>
                <BookOpenText className="w-6 h-6 mb-6 text-accent-blue" />
                <h3 className="text-2xl font-medium mb-3">Curriculum-Aligned AI</h3>
                <p className="text-foreground/70 max-w-md leading-relaxed">
                  No more scattered prompts. The environment maps perfectly to standard textbooks like P.N. Okeke and New School Chemistry.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-charcoal/50 flex gap-12">
                <div>
                  <div className="text-[10px] font-mono text-foreground/40 uppercase tracking-widest mb-2">Indexed Texts</div>
                  <div className="text-3xl font-bold tracking-tight">12+ TOCs</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-foreground/40 uppercase tracking-widest mb-2">Subtopics</div>
                  <div className="text-3xl font-bold tracking-tight">4,200+</div>
                </div>
              </div>
            </BentoBox>

            {/* Card 2 */}
            <BentoBox className="flex flex-col min-h-[160px]">
              <Sparkles className="w-5 h-5 mb-4 text-accent-blue" />
              <h3 className="text-base font-medium mb-2">Instant explanations</h3>
              <p className="text-foreground/70 text-sm leading-relaxed">
                Complex concepts decoded into simple, intuitive breakdowns.
              </p>
            </BentoBox>

            {/* Card 3 */}
            <BentoBox className="flex flex-col min-h-[160px]">
              <FolderCog className="w-5 h-5 mb-4 text-accent-blue" />
              <h3 className="text-base font-medium mb-2">Organise your library</h3>
              <p className="text-foreground/70 text-sm leading-relaxed">
                A centralized vault for all your curated knowledge resources.
              </p>
            </BentoBox>

            {/* Card 4 */}
            <BentoBox className="flex flex-col min-h-[160px]">
              <Network className="w-5 h-5 mb-4 text-accent-blue" />
              <h3 className="text-base font-medium mb-2">Follow structured content</h3>
              <p className="text-foreground/70 text-sm leading-relaxed">
                Linear pathways built around your academic roadmap.
              </p>
            </BentoBox>

            {/* Card 5 */}
            <BentoBox className="flex flex-col min-h-[160px]">
              <TrendingUp className="w-5 h-5 mb-4 text-foreground/50" />
              <h3 className="text-base font-medium mb-2">Track your progress</h3>
              <p className="text-foreground/70 text-sm leading-relaxed">
                Visual feedback loops that highlight mastery and growth areas.
              </p>
            </BentoBox>

            {/* Card 6 */}
            <BentoBox className="flex flex-col min-h-[160px]">
              <GraduationCap className="w-5 h-5 mb-4 text-foreground/50" />
              <h3 className="text-base font-medium mb-2">Learn interactively</h3>
              <p className="text-foreground/70 text-sm leading-relaxed">
                A unified workspace designed to eliminate cognitive load.
              </p>
            </BentoBox>
          </BentoGrid>
        </section>

        {/* Pricing Section */}
        <Pricing />

      </main>

      {/* Footer */}
      <footer className="border-t border-charcoal/50 bg-obsidian mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-foreground/50">
          <div>
            <span>StudySphere Protocol v1.0.0</span>
          </div>
          <div className="flex gap-6">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green"></span>
              0G Storage: Online
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green"></span>
              0G Compute: Online
            </span>
          </div>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-foreground">GitHub</Link>
            <Link href="#" className="hover:text-foreground">Docs</Link>
            <Link href="#" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
