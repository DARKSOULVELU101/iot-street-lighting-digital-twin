"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GitFork, Menu, RadioTower, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "#overview", label: "Overview" },
  { href: "#components", label: "Components" },
  { href: "#digital-twin", label: "3D Twin" },
  { href: "#sensors", label: "Sensors" },
  { href: "#dashboard", label: "Dashboard" },
  { href: "#telegram", label: "Telegram" },
  { href: "#faults", label: "Faults" },
  { href: "#report", label: "Report" },
  { href: "#stack", label: "Stack" },
];

const GITHUB_URL = "https://github.com/";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const reduce = useReducedMotion();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
        scrolled ? "border-b border-line bg-ink-950/85 backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-6 px-5 sm:px-8">
        <a href="#top" className="flex shrink-0 items-center gap-2.5" aria-label="Project home">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
            <RadioTower className="h-4 w-4 text-primary" />
            <span className="absolute inset-0 rounded-lg bg-primary/20 blur-md" aria-hidden="true" />
          </span>
          <span className="hidden text-sm font-semibold tracking-tight text-white sm:block">
            Smart<span className="text-primary">Lamp</span>
          </span>
        </a>

        <nav className="ml-auto hidden items-center gap-5 lg:flex" aria-label="Section navigation">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[13px] text-white/55 transition-colors hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
                  <GitFork className="h-3.5 w-3.5" />
              Repository
            </a>
          </Button>
          <Button
            asChild
            size="sm"
            onClick={() => setMenuOpen(false)}
          >
            <a href="#digital-twin">Open twin</a>
          </Button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-line text-white/70 transition-colors hover:text-white lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
            <DialogContent
              className="left-3 right-3 top-16 max-w-none translate-x-0 translate-y-0 p-4"
              aria-describedby={undefined}
            >
              <DialogTitle className="sr-only">Navigation</DialogTitle>
              <nav className="flex flex-col" aria-label="Mobile navigation">
                {NAV_ITEMS.map((item, index) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    initial={reduce ? false : { opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: reduce ? 0 : index * 0.04, duration: 0.3 }}
                    className="border-b border-line px-2 py-3 text-sm text-white/75 last:border-0 hover:text-primary"
                  >
                    {item.label}
                  </motion.a>
                ))}
              </nav>
              <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                <a href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
              <GitFork className="h-3.5 w-3.5" />
                  GitHub repository
                </a>
              </Button>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-white/40 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogContent>
          </Dialog>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
