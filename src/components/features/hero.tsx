import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative py-16 overflow-hidden">
      {/* Background gradient using your color scheme */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-secondary" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
         

          {/* Main heading with multiple lines */}
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-8xl">
            <span className="block">Decode Complex</span>
            <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Legal Documents
            </span>
            <span className="block text-3xl sm:text-4xl lg:text-5xl font-medium text-muted-foreground mt-2">
              in Seconds, Not Hours
            </span>
          </h1>

          {/* Description paragraph */}
          <div className="mx-auto mt-8 max-w-3xl space-y-4">
            <p className="text-lg text-muted-foreground sm:text-xl leading-relaxed">
              Transform overwhelming legal jargon into clear, actionable insights. 
              PolicyWise AI analyzes insurance policies, contracts, terms of service, 
              and privacy policies with unprecedented accuracy.
            </p>
           
          </div>

          {/* Single CTA button */}
          <div className="mt-12 flex items-center justify-center">
            <Button 
              size="lg" 
              asChild 
              className="group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 text-base font-semibold border-0"
            >
              <Link href="/" className="flex items-center gap-2">
                Get Started For Free
                <ArrowRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Floating elements for visual interest using your colors */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
        <div className="h-96 w-96 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl"></div>
      </div>
    </section>
  );
}