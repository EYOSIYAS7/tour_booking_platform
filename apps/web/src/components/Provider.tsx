// apps/web/src/components/Providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  // Create a client instance of QueryClient only once
  const [queryClient] = useState(() => new QueryClient());

  return (
    // Wrap the application with QueryClientProvider and pass the client instance
    // This component uses the React Context API to "provide" the queryClient instance to all its children.
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
