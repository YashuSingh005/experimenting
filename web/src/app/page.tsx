"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black">
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-black/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="font-mono text-sm text-muted-foreground">~/assistant</span>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs">sign in</Button>
            </Link>
            <Link href="/register">
              <Button variant="default" size="sm" className="text-xs">register</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex flex-1 items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-lg text-center"
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="font-mono text-xs text-muted-foreground">system ready</span>
          </div>

          <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            assistant
          </h1>

          <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
            a simple ai assistant for engineering work.
            <br />
            ask questions, debug code, explore ideas.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link href="/register">
              <Button variant="default" size="lg" className="px-6 text-sm">
                get started
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-6 text-sm">
                sign in
              </Button>
            </Link>
          </div>

          <div className="mt-12">
            <div className="mx-auto max-w-sm rounded-md border border-border bg-card p-3">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <span className="text-xs font-mono text-muted-foreground">$</span>
                <span className="text-xs font-mono text-foreground/80">./assistant --help</span>
              </div>
              <pre className="mt-2 text-left text-xs leading-relaxed text-muted-foreground font-mono">
{`usage: assistant [command]

commands:
  ask      ask a question
  debug    debug your code
  explore  explore a topic

options:
  --help   show this message`}
              </pre>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-border py-4">
        <p className="text-center font-mono text-xs text-muted-foreground">
          assistant v0.1.0
        </p>
      </footer>
    </div>
  );
}
