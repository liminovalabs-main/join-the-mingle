"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { AuthProvider } from "@/context/auth-context";

import { AuthModalManager } from "@/components/auth/auth-modal-manager";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <AuthModalManager />
        <Toaster
          position="bottom-center"
          closeButton
          toastOptions={{
            style: {
              background: "#E05A47",
              color: "#FFFFFF",
              border: "1px solid #D04F3D",
              fontFamily: "var(--font-body)",
              borderRadius: "9999px",
              padding: "0.85rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: "600",
              boxShadow: "0 10px 25px -5px rgba(224, 90, 71, 0.45)",
            },
            classNames: {
              title: "text-white font-bold",
              description: "text-white/95",
              closeButton: "!bg-white !text-[#E05A47] !border-none",
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
