"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      theme="dark"
      duration={3600}
      toastOptions={{
        classNames: {
          toast:
            "!bg-surface !border !border-border !text-text !rounded-md !shadow-lg !font-medium",
          title: "!text-text !text-sm",
          description: "!text-muted !text-xs",
          actionButton: "!bg-text !text-bg !rounded-md",
          cancelButton: "!bg-surface-2 !text-text !rounded-md",
        },
      }}
    />
  );
}
