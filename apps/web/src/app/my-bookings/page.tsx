// apps/web/src/app/my-bookings/page.tsx
"use client";
import { useQuery } from "@tanstack/react-query"; // for managing server state after fetching

// Define types for clarity
type Tour = { id: string; name: string; location: string };
type Booking = { id: string; bookingDate: string; tour: Tour };

// Function to fetch bookings from the backend API
const getMyBookings = async (): Promise<Booking[]> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/bookings/my-bookings`,
    {
      credentials: "include",
    }
  );
  if (!response.ok) throw new Error("Failed to fetch bookings");
  return response.json();
};

export default function MyBookingsPage() {
  // Use React Query to fetch and cache bookings
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: getMyBookings,
  });

  if (isLoading) return <span>Loading your bookings...</span>;
  if (isError) return <span>Could not fetch your bookings.</span>;

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">My Bookings</h1>
      <div className="space-y-4">
        {data?.map((booking) => (
          <div key={booking.id} className="border p-4 rounded-lg">
            <h2 className="font-semibold">{booking.tour.name}</h2>
            <p>Location: {booking.tour.location}</p>
            <p>
              Booked on: {new Date(booking.bookingDate).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
