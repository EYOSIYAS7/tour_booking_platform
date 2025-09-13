"use client";

import AdminSidebar from "@/components/AdminSidebar"; // Import our new sidebar
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // The permission check logic remains the same
    if (isAuthenticated && user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  // While checking, or if not an admin, show a loading/permission state
  if (!isAuthenticated || user?.role !== "ADMIN") {
    return (
      <div className="text-center p-8">
        {" "}
        you don't have the previlage for this page,
        <Link href="/"> Click here to navigate back</Link>
      </div>
    );
  }

  // This is the new visual layout
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-grow p-4 sm:p-8 bg-gray-50">{children}</main>
    </div>
  );
}
