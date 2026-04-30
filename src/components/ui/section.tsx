import { cn } from "@/lib/utils";

export function Section({ children, className, id }: { children: React.ReactNode, className?: string, id?: string }) {
  return (
    <section id={id} className={cn("w-full py-16 md:py-32", className)}>
      {children}
    </section>
  );
}
