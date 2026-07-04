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
            background: "hsl(0 0% 6%)",
            color: "hsl(0 0% 95%)",
            border: "1px solid hsl(240 3.7% 12%)",
          },
        }}
      />
    </>
  );
}
