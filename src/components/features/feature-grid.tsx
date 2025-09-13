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
    title: "T&amp;C Summarizer",
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
    <section className="py-20 sm:py-32">
      <div className="container">
        <div className="text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            A smarter way to read the fine print
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Our suite of tools is designed to bring clarity and confidence to your document analysis.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <Card key={i} className="transform-gpu transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <CardHeader className="flex flex-row items-center gap-4">
                {feature.icon}
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
