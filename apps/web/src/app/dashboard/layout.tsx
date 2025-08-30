// apps/web/src/app/dashboard/layout.tsx
"use client";

import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Render nothing or a loading spinner while checking, then the page
  if (!isAuthenticated) {
    return null; // or a loading component
  }

  return <>{children}</>;
}
