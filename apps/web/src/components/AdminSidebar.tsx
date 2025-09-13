"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Package, ShoppingCart, Users } from "lucide-react";

const navLinks = [
  { name: "Dashboard", href: "/admin", icon: ShieldCheck },
  { name: "Manage Tours", href: "/admin/tours", icon: Package },
  { name: "Manage Bookings", href: "/admin/bookings", icon: ShoppingCart },
  { name: "Manage Users", href: "/admin/users", icon: Users },
  // We can add a link for user management later
  // { name: 'Manage Users', href: '/admin/users', icon: Users },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-950 text-white h-screen sticky top-0">
      <div className="p-6">
        <h2 className="text-2xl font-bold">Admin Panel</h2>
      </div>
      <nav className="flex flex-col p-4">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center px-4 py-3 rounded-md text-lg transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <link.icon className="w-6 h-6 mr-3" />
              {link.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
