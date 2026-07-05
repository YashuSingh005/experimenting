"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";

interface AISettings {
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  context_length: number;
  model_name: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AISettings>({
    system_prompt: "",
    temperature: 0.7,
    max_tokens: 4096,
    top_p: 0.9,
    context_length: 8192,
    model_name: "openai/gpt-4o-mini",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const json = await res.json();
          setSettings(json);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success("Settings saved");
      } else {
        toast.error("Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white">AI Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Configure the AI model parameters
        </p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Model Configuration</CardTitle>
          <CardDescription>
            These settings affect how the AI responds to users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">System Prompt</label>
            <textarea
              value={settings.system_prompt}
              onChange={(e) =>
                setSettings({ ...settings, system_prompt: e.target.value })
              }
              rows={6}
              className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white resize-none focus:border-primary/50 focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Temperature"
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={settings.temperature}
              onChange={(e) =>
                setSettings({ ...settings, temperature: parseFloat(e.target.value) })
              }
            />
            <Input
              label="Max Tokens"
              type="number"
              min={1}
              max={32000}
              value={settings.max_tokens}
              onChange={(e) =>
                setSettings({ ...settings, max_tokens: parseInt(e.target.value) })
              }
            />
            <Input
              label="Top P"
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={settings.top_p}
              onChange={(e) =>
                setSettings({ ...settings, top_p: parseFloat(e.target.value) })
              }
            />
            <Input
              label="Context Length"
              type="number"
              min={1}
              max={128000}
              value={settings.context_length}
              onChange={(e) =>
                setSettings({ ...settings, context_length: parseInt(e.target.value) })
              }
            />
          </div>

          <Input
            label="Model Name"
            value={settings.model_name}
            onChange={(e) =>
              setSettings({ ...settings, model_name: e.target.value })
            }
          />

          <Button onClick={save} disabled={saving} variant="default">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
