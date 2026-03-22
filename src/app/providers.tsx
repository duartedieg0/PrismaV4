"use client";

import { Toaster } from "sonner";

type ProvidersProps = Readonly<{
  children: React.ReactNode;
}>;

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  );
}
