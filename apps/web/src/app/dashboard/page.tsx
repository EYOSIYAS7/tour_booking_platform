// apps/web/src/app/dashboard/page.tsx
import { useAuthStore } from "@/store/auth.store";

// This is a placeholder for a real dashboard page
// Note: We protect this route via its layout file
export default function DashboardPage() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>
        This is a protected page. You can only see this if you are logged in.
      </p>
    </main>
  );
}
