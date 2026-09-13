"use client";

import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { seedInitialOfflineData } from "@/lib/offline/sync/syncEngine";
import { ThemeProvider } from "@/context/ThemeContext";
import { GlobalSearchModal } from "./GlobalSearchModal";

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    // Seed local IndexedDB on first load in background
    seedInitialOfflineData();
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <GlobalSearchModal />
      </QueryClientProvider>
    </ThemeProvider>
  );
};

