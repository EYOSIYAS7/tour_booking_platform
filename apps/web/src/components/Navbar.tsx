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
    <nav className="bg-white border-b border-gray-100 py-4">
      <div className="container mx-auto flex justify-between items-center px-6">
        <Link
          href="/"
          className="text-2xl font-semibold text-indigo-600 tracking-tight"
        >
          TourAddis
        </Link>
        <div className="flex items-center space-x-5">
          {isAuthenticated && user?.role === "ADMIN" && (
            <>
              <Link
                href="/admin"
                className="text-gray-600 hover:text-indigo-600"
              >
                Admin
              </Link>
            </>
          )}
          {isAuthenticated ? (
            <div className="flex items-center space-x-5">
              <span className="text-gray-700 font-medium">
                Welcome, {user?.email}
              </span>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-indigo-600 transition-colors duration-200"
              >
                Dashboard
              </Link>
              <Link
                href="/my-bookings"
                className="text-gray-600 hover:text-emerald-600 transition-colors duration-200"
              >
                My Bookings
              </Link>
              <button
                onClick={handleLogout}
                disabled={mutation.isPending}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 disabled:opacity-50"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-indigo-600 transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors duration-200"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
