// Create new file at: apps/web/src/app/admin/bookings/page.tsx

"use client";

import { useQuery } from "@tanstack/react-query";

// --- Type Definitions for our API response ---
type BookingUser = {
  name: string | null;
  email: string;
};
type BookingTour = {
  name: string;
};
type Booking = {
  id: string;
  bookingDate: string;
  user: BookingUser;
  tour: BookingTour;
};

// --- API Fetching Function ---
const getAdminBookings = async (): Promise<Booking[]> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/bookings/admin/all`,
    {
      credentials: "include", // Important for sending our auth cookie
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch bookings");
  }
  return response.json();
};

// --- The Main Page Component ---
export default function AdminBookingsPage() {
  const {
    data: bookings,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: getAdminBookings,
  });

  if (isLoading)
    return <div className="p-8 text-center">Loading all bookings...</div>;
  if (isError)
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load bookings.
      </div>
    );

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-8">Manage Bookings</h1>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tour Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Booked By (User)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Booking Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Booking ID
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings?.map((booking) => (
              <tr key={booking.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {booking.tour.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {booking.user.email}
                  </div>
                  <div className="text-sm text-gray-500">
                    {booking.user.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(booking.bookingDate).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 font-mono">
                  {booking.id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
