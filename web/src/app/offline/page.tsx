import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline — Yashu",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-[0.625rem] bg-primary text-lg font-semibold text-primary-foreground select-none">
          Y
        </div>
        <h1 className="text-lg font-semibold text-foreground">
          You&apos;re offline
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Check your connection and try again.
        </p>
      </div>
    </div>
  );
}
