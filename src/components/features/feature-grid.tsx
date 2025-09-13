import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileScan, FileText, Gavel, GitCompareArrows } from "lucide-react";

const features = [
  {
    icon: <FileScan className="h-8 w-8 text-primary" />,
    title: "Insurance Analyzer",
    description: "Deep dive into your insurance policies. Understand coverage, exclusions, and costs with unparalleled clarity.",
  },
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: "Privacy Policy Summarizer",
    description: "Get concise, easy-to-understand summaries of lengthy privacy policies. Know how your data is being used.",
  },
  {
    icon: <Gavel className="h-8 w-8 text-primary" />,
    title: "T&C Summarizer",
    description: "Cut through the legal jargon in terms and conditions. We highlight key clauses and potential red flags.",
  },
  {
    icon: <GitCompareArrows className="h-8 w-8 text-primary" />,
    title: "Comparison Tool",
    description: "Compare different documents side-by-side. Easily spot differences between policy versions or service agreements.",
  },
];

export default function FeatureGrid() {
  return (
    <section className="relative py-20 px-10 sm:py-32 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.05),transparent_50%),radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.05),transparent_50%)]" />
      
      <div className="container relative">
        {/* Header Section */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            A smarter way to read the fine print
          </h2>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl leading-relaxed">
            Our suite of tools is designed to bring clarity and confidence to your document analysis.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <Card 
              key={i} 
              className="group relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 hover:bg-card/80"
            >
              {/* Subtle gradient border effect */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/10 via-transparent to-accent/10 p-[1px]">
                <div className="h-full w-full rounded-lg bg-card/80 backdrop-blur-sm" />
              </div>
              
              {/* Card content */}
              <div className="relative z-10 p-6">
                <CardHeader className="flex flex-col items-start gap-4 space-y-0 p-0">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold leading-tight transition-colors group-hover:text-primary">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-4">
                  <p className="text-muted-foreground leading-relaxed transition-colors group-hover:text-muted-foreground/90">
                    {feature.description}
                  </p>
                </CardContent>
              </div>

              {/* Hover glow effect */}
              <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100 -z-10" />
            </Card>
          ))}
        </div>
      </div>

      {/* Background decorative elements */}
      <div className="absolute left-1/4 top-1/4 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute right-1/4 bottom-1/4 h-32 w-32 rounded-full bg-accent/5 blur-3xl" />
    </section>
  );
}