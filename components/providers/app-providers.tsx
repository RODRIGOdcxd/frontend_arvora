"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { apiMockEnabled } from "@/lib/api/client"

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [cliente] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )
  const [listo, setListo] = React.useState(!apiMockEnabled())

  React.useEffect(() => {
    if (!apiMockEnabled()) return
    let vigente = true
    void import("@/mocks/browser")
      .then(({ worker }) =>
        worker.start({
          onUnhandledFrame: "bypass",
          serviceWorker: { url: "/mockServiceWorker.js" },
        }),
      )
      .then(() => {
        if (vigente) setListo(true)
      })
    return () => {
      vigente = false
    }
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={cliente}>
        {listo ? (
          children
        ) : (
          <div className="flex min-h-svh items-center justify-center bg-background text-sm text-muted-foreground">
            Preparando el modo demostración…
          </div>
        )}
        <Toaster richColors closeButton />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
