"use client";

import { useState } from "react";
import Link from "next/link";
// import { AppHeader } from "@/components/layout/AppHeader";
import { BentoBox, BentoGrid } from "@/components/ui/bento-box";
import { BookOpen, Clock, ChevronRight, GraduationCap, Microscope, Upload, FileText, Bot } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { useCurriculum } from "@/context/CurriculumContext";

type LearningItem = {
  id: string;
  name: string;
  subtitle: string;
  progress: number;
  timeSpent: string;
  lastTopic: string;
};

export default function HubPage() {
  const { secondaryTextbooks, universityCourses } = useCurriculum();

  return (
    <div className="min-h-screen bg-obsidian flex flex-col font-sans mb-12">
      <AppHeader />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full flex flex-col gap-12">

        {/* Page Title */}
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Identify Path of Inquiry</h1>
          <p className="text-sm font-mono text-foreground/50 mt-1">Select your environment context</p>
        </div>

        {/* Section 1: Secondary School */}
        <section>
          <div className="flex items-center gap-2 mb-6 border-b border-charcoal/50 pb-2">
            {/* <BookOpen className="w-5 h-5 text-foreground/80" /> */}
            <div className="w-5 h-5" />
            <h2 className="text-4xl font-medium tracking-tight">Secondary School</h2>
            <span className="ml-2 text-xs font-mono uppercase text-foreground/40 bg-charcoal px-2 py-0.5 rounded-sm">Textbook Layer</span>
          </div>

          <BentoGrid className="md:grid-cols-2 lg:grid-cols-4">
            {secondaryTextbooks.map((item) => (
              <Link href={`/ide?subject=${item.id}`} key={item.id}>
                <BentoBox className="group hover:border-foreground/30 transition-colors cursor-pointer h-full flex flex-col justify-between min-h-[220px]">
                  <div>
                    <div className="flex justify-end items-start mb-4">
                      <div className="flex items-center gap-1 text-xs font-mono text-foreground/50">
                        <Clock className="w-3 h-3" /> {item.timeSpent}
                      </div>
                    </div>
                    <h3 className="text-lg font-medium leading-tight mb-2">{item.name}</h3>
                    <p className="text-xs text-foreground/50 truncate">
                      Latest: {item.lastTopic}
                    </p>
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-foreground/40">Completion</span>
                      <span className="text-xs font-mono">{item.progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-charcoal rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-blue transition-all duration-1000 ease-out"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                </BentoBox>
              </Link>
            ))}
          </BentoGrid>
        </section>

        {/* Section 2: University */}
        <section>
          <div className="flex items-center gap-2 mb-6 border-b border-charcoal/50 pb-2">
            {/* <GraduationCap className="w-5 h-5 text-foreground/80" /> */}
            <div className="w-5 h-5" />
            <h2 className="text-4xl font-bold tracking-tight">University</h2>
            <span className="ml-2 text-xs font-mono uppercase text-foreground/40 bg-charcoal px-2 py-0.5 rounded-sm">Course Layer</span>
          </div>

          <BentoGrid className="md:grid-cols-2 lg:grid-cols-4">
            {universityCourses.map((item) => (
              <Link href={`/ide?subject=${item.id}`} key={item.id}>
                <BentoBox className="group hover:border-foreground/30 transition-colors cursor-pointer h-full flex flex-col justify-between min-h-[220px]">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="px-2 py-1 bg-charcoal text-[10px] font-mono rounded-sm text-foreground/70 uppercase">
                        {item.name}
                      </div>
                      <div className="flex items-center gap-1 text-xs font-mono text-foreground/50">
                        <Clock className="w-3 h-3" /> {item.timeSpent}
                      </div>
                    </div>
                    <h3 className="text-lg font-medium leading-tight mb-2">{item.subtitle}</h3>
                    <p className="text-xs text-foreground/50 truncate">
                      Latest: {item.lastTopic}
                    </p>
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-foreground/40">Syllabus Covered</span>
                      <span className="text-xs font-mono text-accent-green">{item.progress}%</span>
                    </div>
                    <div className="w-full h-px bg-charcoal overflow-hidden relative">
                      <div
                        className="absolute h-full bg-accent-green transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                </BentoBox>
              </Link>
            ))}
          </BentoGrid>
        </section>

        {/* Section 3: Regular (Researchers) */}
        <section>
          <div className="flex items-center gap-2 mb-6 border-b border-charcoal/50 pb-2">
            {/* <Microscope className="w-5 h-5 text-foreground" /> */}
            <div className="w-5 h-5" />
            <h2 className="text-3xl font-medium tracking-tight">Regular <span className="text-foreground/50 font-normal">(Researchers)</span></h2>
            <span className="ml-2 text-xs font-mono uppercase text-foreground/40 bg-charcoal px-2 py-0.5 rounded-sm">Custom Environment</span>
          </div>

          <BentoGrid className="md:grid-cols-3">

            {/* Action Card */}
            <BentoBox className="md:col-span-1 flex flex-col justify-center items-center text-center border-accent-blue/30 bg-accent-blue/5 hover:bg-accent-blue/10 transition-colors cursor-pointer group py-12">
              <div className="w-12 h-12 rounded-full border border-accent-blue/50 flex items-center justify-center mb-4 group-hover:bg-accent-blue/20 transition-colors">
                <Upload className="w-5 h-5 text-accent-blue" />
              </div>
              <h3 className="text-lg font-medium mb-2">Create new Environment</h3>
              <p className="text-xs text-foreground/60 max-w-[200px] mb-6">
                Upload PDFs, datasets, or academic papers to generate instant summaries and insights.
              </p>
              <Link href="/ide?mode=research">
                <Button size="sm" className="gap-2">
                  <Bot className="w-3.5 h-3.5" /> Start Interactive AI Chat
                </Button>
              </Link>
            </BentoBox>

            {/* Recent Documents & Insights */}
            <BentoBox className="md:col-span-2 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-foreground/50" /> Recent Documents & Insights
                </h3>
                <Link href="#" className="text-xs font-mono text-accent-blue hover:underline">View All &rarr;</Link>
              </div>

              <div className="flex-1 flex flex-col gap-3">
                <div className="p-3 border border-charcoal bg-obsidian rounded-sm flex items-start justify-between group hover:border-foreground/30 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-charcoal/50 rounded-sm">
                      <FileText className="w-4 h-4 text-foreground/70" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Quantum_Mechanics_Overview.pdf</h4>
                      <p className="text-xs text-foreground/50 mt-1 line-clamp-1">Insight: The paper outlines wave-function collapse theories without deterministic variables...</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground/30 group-hover:text-foreground transition-colors mt-2" />
                </div>

                <div className="p-3 border border-charcoal bg-obsidian rounded-sm flex items-start justify-between group hover:border-foreground/30 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-charcoal/50 rounded-sm">
                      <FileText className="w-4 h-4 text-foreground/70" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">History_of_Rome_Notes.docx</h4>
                      <p className="text-xs text-foreground/50 mt-1 line-clamp-1">Summary: Notes covering the fall of the republic and transition to the Pax Romana period.</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground/30 group-hover:text-foreground transition-colors mt-2" />
                </div>
              </div>
            </BentoBox>

          </BentoGrid>
        </section>

      </main>
    </div>
  );
}
