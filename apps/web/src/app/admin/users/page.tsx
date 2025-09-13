// Create new file at: apps/web/src/app/admin/users/page.tsx

"use client";

import { useAuthStore } from "@/store/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// --- Type Definitions ---
type User = {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
};

// --- API Fetching Function ---
const getAdminUsers = async (): Promise<User[]> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/all`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
};

// --- The Main Page Component ---
export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const loggedInUser = useAuthStore((state) => state.user);

  const {
    data: users,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers,
  });

  // --- API Mutation for Updating a User's Role (with Optimistic UI) ---
  const updateRoleMutation = useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: "USER" | "ADMIN";
    }) => {
      return fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/admin/${userId}/role`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ role }),
        }
      );
    },
    // --- Optimistic Update Logic ---
    onMutate: async (newData) => {
      // 1. Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["admin-users"] });

      // 2. Snapshot the previous value
      const previousUsers = queryClient.getQueryData<User[]>(["admin-users"]);

      // 3. Optimistically update to the new value
      queryClient.setQueryData<User[]>(["admin-users"], (old) =>
        old
          ? old.map((user) =>
              user.id === newData.userId
                ? { ...user, role: newData.role }
                : user
            )
          : []
      );

      // 4. Return a context object with the snapshotted value
      return { previousUsers };
    },
    // 5. If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newData, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(["admin-users"], context.previousUsers);
      }
      alert(`Failed to update role: ${err.message}`);
    },
    // 6. Always refetch after error or success to ensure server state
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const handleRoleChange = (userId: string, role: "USER" | "ADMIN") => {
    updateRoleMutation.mutate({ userId, role });
  };

  if (isLoading)
    return <div className="p-8 text-black text-center">Loading users...</div>;
  if (isError)
    return (
      <div className="p-8 text-center text-red-500">Failed to load users.</div>
    );

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <h1 className="text-3xl text-black font-bold mb-8">Manage Users</h1>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users?.map((user) => (
              <tr key={user.id}>
                <td className="px-6 text-black py-4 whitespace-nowrap font-medium">
                  {user.email}
                </td>
                <td className="px-6 text-black py-4 whitespace-nowrap">
                  {user.name || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === "ADMIN"
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  {user.role === "USER" ? (
                    <button
                      onClick={() => handleRoleChange(user.id, "ADMIN")}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Promote to Admin
                    </button>
                  ) : (
                    // Prevent an admin from demoting themselves if they are the one logged in
                    <button
                      onClick={() => handleRoleChange(user.id, "USER")}
                      disabled={user.id === loggedInUser?.id}
                      className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      Demote to User
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
