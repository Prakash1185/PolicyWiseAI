import { Github, Linkedin, Twitter } from "lucide-react";
import { Logo } from "@/components/logo";

export default function Footer() {
  return (
    <footer className="border-t px-10 border-border/40">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Logo />
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} PolicyWise AI. All rights reserved.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
            <Twitter className="h-5 w-5" />
          </a>
          <a href="#" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
            <Github className="h-5 w-5" />
          </a>
          <a href="#" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
            <Linkedin className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
