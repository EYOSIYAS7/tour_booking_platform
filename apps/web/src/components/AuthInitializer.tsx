// apps/web/src/components/AuthInitializer.tsx
"use client";

import { useAuthStore } from "@/store/auth.store";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const getMe = async () => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Not authenticated");
  }
  return response.json();
};

export default function AuthInitializer() {
  const { login, logout } = useAuthStore();
  const { data, isSuccess, isError } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: 1, // Only try once on initial load
  });

  useEffect(() => {
    if (isSuccess && data) {
      login(data);
    }
    if (isError) {
      logout();
    }
  }, [isSuccess, isError, data, login, logout]);

  return null; // This component does not render anything
}
