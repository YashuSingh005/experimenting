"use client";

import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "hsl(0 0% 4%)",
            color: "hsl(0 0% 88%)",
            border: "1px solid hsl(0 0% 9%)",
            borderRadius: "0.375rem",
            fontSize: "0.8125rem",
            fontFamily: "ui-monospace, monospace",
          },
        }}
      />
    </>
  );
}
