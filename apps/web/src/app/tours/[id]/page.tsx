// Create a new file at: apps/web/src/app/tours/[id]/page.tsx
"use client";

import { useAuthStore } from "@/store/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React from "react";

// --- Type Definitions ---
// These should ideally be in a shared types file later
type PageProps = {
  params: Promise<{ tourId: string }>; // params is now a Promise
};
type ReviewUser = { name: string | null; email: string };
type Review = {
  id: string;
  rating: number;
  comment: string;
  user: ReviewUser;
};
type Tour = {
  id: string;
  name: string;
  location: string;
  description: string;
  price: number;
  imageUrl: string | null;
  reviews: Review[];
};

// --- API Fetching Function ---
const getTourById = async (tourId: string): Promise<Tour> => {
  console.log("tour id", tourId);
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/tours/cmer6iemi0003wn68gxqiu9az`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch tour details");
  }
  return response.json();
};

// --- The Page Component ---
export default function TourDetailPage({ params }: PageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { tourId } = React.use(params);
  //   const tourId = params.id;

  // --- Data Fetching with TanStack Query ---

  const {
    data: tour,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tour", tourId],
    queryFn: () => getTourById(tourId),
  });
  console.log("tour data  ", tour);
  // --- API Mutation for Booking ---
  const bookingMutation = useMutation({
    mutationFn: () => {
      return fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tourId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      alert("Tour booked successfully! Check your bookings page.");
      router.push("/my-bookings");
    },
    onError: (error) => {
      alert(`Booking failed: ${error.message}`);
    },
  });

  // --- Event Handler for the "Book Now" Button ---
  const handleBookNow = () => {
    if (!isAuthenticated) {
      // Redirect to login page, but also tell it where to come back to after login
      router.push(`/login?redirect=/tours/${tourId}`);
    } else {
      bookingMutation.mutate();
    }
  };

  // --- Render Logic ---
  if (isLoading) return <div className="text-center p-10">Loading Tour...</div>;
  if (isError || !tour)
    return (
      <div className="text-center p-10 text-red-500">Could not find tour.</div>
    );

  return (
    <main className="container mx-auto p-4 sm:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Image */}
        <div className="lg:col-span-3">
          <img
            src={tour.imageUrl || "https://via.placeholder.com/800x600"}
            alt={tour.name}
            className="w-full h-auto object-cover rounded-lg shadow-lg"
          />
        </div>

        {/* Right Column: Details & Booking */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h1 className="text-3xl font-bold text-gray-800">{tour.name}</h1>
            <p className="text-lg text-gray-600 mt-2">{tour.location}</p>
            <p className="text-2xl font-bold text-indigo-600 my-4">
              ${tour.price}
            </p>
            <p className="text-gray-700 leading-relaxed">{tour.description}</p>
            <button
              onClick={handleBookNow}
              disabled={bookingMutation.isPending}
              className="mt-6 w-full bg-green-500 text-white font-bold py-3 px-4 rounded-md hover:bg-green-600 transition-colors disabled:bg-green-300"
            >
              {bookingMutation.isPending ? "Booking..." : "Book Now"}
            </button>
            {!isAuthenticated && (
              <p className="text-center text-sm text-gray-500 mt-2">
                You must be logged in to book a tour.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">Reviews</h2>
        <div className="space-y-6">
          {tour.reviews ? (
            tour.reviews.map((review) => (
              <div key={review.id} className="bg-white p-4 border rounded-lg">
                <p className="font-semibold">{review.user.email}</p>
                <p className="text-yellow-500">{"⭐".repeat(review.rating)}</p>
                <p className="mt-2 text-gray-600">{review.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No reviews for this tour yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
// issues to fix
// tour id im not getting it
// review should be an array but there is an issue  why does it get me a review
