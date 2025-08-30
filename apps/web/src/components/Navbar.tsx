// apps/web/src/components/Navbar.tsx
"use client";

import { useAuthStore } from "@/store/auth.store";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function Navbar() {
  //gets the logged in user from zustand central state management
  const { isAuthenticated, user, logout: logoutFromStore } = useAuthStore();
  const router = useRouter();

  // we used useMutation of tanstack not just to make the request but it is a state management
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Logout failed");
    },
    onSuccess: () => {
      logoutFromStore();
      router.push("/login");
    },
  });

  const handleLogout = () => {
    mutation.mutate();
  };

  return (
    <nav className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          TourAddis
        </Link>
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span>Welcome, {user?.email}</span>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-indigo-600"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                disabled={mutation.isPending}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-gray-600 hover:text-indigo-600"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
