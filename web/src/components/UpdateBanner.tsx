"use client";

import { useServiceWorkerUpdate } from "@/hooks/useServiceWorkerUpdate";

export function UpdateBanner() {
  const { updateAvailable, applyUpdate } = useServiceWorkerUpdate();

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-full border border-border bg-[#0A0A0A] px-5 py-2.5 shadow-lg shadow-black/40 motion-safe:animate-fade-in-up">
        <span className="text-sm text-foreground">New version available</span>
        <button
          type="button"
          onClick={applyUpdate}
          className="rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Update
        </button>
      </div>
    </div>
  );
}
