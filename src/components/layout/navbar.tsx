import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChevronDown, Menu } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const navLinks = [
    { href: "#pricing", label: "Pricing" },
    { href: "#about", label: "About" },
    { href: "#contact", label: "Contact" },
  ];

  const features = [
      {
        href: "/features/analyse-insurance",
        label: "Analyse an insurance or policy",
      },
      {
        href: "/features/compare-policies",
        label: "Compare policies",
      },
      {
        href: "/features/summarise-terms",
        label: "Summarise terms and conditions",
      },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Logo />

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground">
              Features <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {features.map((feature) => (
                <DropdownMenuItem key={feature.label} asChild>
                  <Link href={feature.href}>{feature.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button className="hidden sm:flex" asChild>
            <Link href="/login">Get Started</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col gap-6 pt-10">
                <Logo />
                <nav className="grid gap-4 text-lg font-medium">
                  <div className="group">
                    <div className="text-muted-foreground">Features</div>
                    <div className="grid gap-2 pt-2">
                      {features.map((feature) => (
                        <Link key={feature.label} href={feature.href} className="text-muted-foreground/80 transition-colors hover:text-foreground text-base font-normal">
                          {feature.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                  {navLinks.map((link) => (
                    <a key={link.label} href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
                      {link.label}
                    </a>
                  ))}
                </nav>
                <Button asChild>
                  <Link href="/login">Get Started</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
