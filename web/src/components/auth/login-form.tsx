"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try { createClient(); setReady(true); } catch { /* not configured */ }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { toast.error(error.message); return; }
      toast.success("logged in");
      router.push("/chat");
      router.refresh();
    } catch {
      toast.error("something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="font-mono text-xs text-muted-foreground">sign in</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">enter your credentials</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading || !ready}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> signing in...</>
            ) : (
              "sign in"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          no account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
