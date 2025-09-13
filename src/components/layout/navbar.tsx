'use client';

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import React from "react";

export default function Navbar() {

  const navLinks = [
    { href: "#pricing", label: "Pricing" },
    { href: "#about", label: "About" },
    { href: "#contact", label: "Contact" },
  ];

  const features: { title: string; href: string; description: string }[] = [
    {
      title: "Analyse an insurance or policy",
      href: "/features/analyse-insurance",
      description: "Upload and analyze your insurance policies to understand the fine print.",
    },
    {
      title: "Compare policies",
      href: "/features/compare-policies",
      description: "Compare two policy documents to spot the differences.",
    },
    {
      title: "Summarise terms and conditions",
      href: "/features/summarise-terms",
      description: "Get a quick summary of long and complex terms and conditions.",
    },
  ];

  return (
    <header className="sticky px-10 top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center">
          <Logo />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-muted-foreground transition-colors hover:text-foreground data-[active]:text-foreground data-[state=open]:text-foreground">
                  Features
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {features.map((component) => (
                      <ListItem
                        key={component.title}
                        title={component.title}
                        href={component.href}
                      >
                        {component.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <a 
                key={link.label} 
                href={link.href} 
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>

        {/* Right Section - Theme Toggle, User Menu, Mobile Menu */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button className="hidden sm:flex font-medium" asChild>
              <Link href="/features/analyse-insurance">Get Started</Link>
          </Button>
          
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <div className="flex flex-col gap-6 pt-6">
                <div className="flex items-center">
                  <Logo />
                </div>
                
                <nav className="grid gap-6 text-lg font-medium">
                  <div className="space-y-3">
                    <div className="text-foreground font-semibold">Features</div>
                    <div className="grid gap-3 pl-2">
                      {features.map((feature) => (
                        <Link 
                          key={feature.title} 
                          href={feature.href} 
                          className="text-muted-foreground/80 transition-colors hover:text-foreground text-base font-normal leading-tight"
                        >
                          {feature.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t border-border pt-4">
                    {navLinks.map((link) => (
                      <a 
                        key={link.label} 
                        href={link.href} 
                        className="block py-2 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </nav>
                
                  <div className="mt-4 pt-4 border-t border-border">
                    <Button className="w-full font-medium" asChild>
                      <Link href="/features/analyse-insurance">Get Started</Link>
                    </Button>
                  </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          href={props.href!}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
