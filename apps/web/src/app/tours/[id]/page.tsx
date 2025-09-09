// Create a new file at: apps/web/src/app/tours/[id]/page.tsx
"use client";

import { useAuthStore } from "@/store/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React from "react";
import { useParams } from "next/navigation";

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
  avgRating: number;
  reviewCount: number;
  price: number;
  imageUrl: string | null;
  reviewComments: [];
};

// --- API Fetching Function ---
const getTourById = async (tourId: any): Promise<Tour> => {
  console.log("tour id", tourId);
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/tours/${tourId}`
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
  const Params = useParams();
  const tourId = Params?.id;
  console.log("tour id rightaway", tourId);
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
      <div className="mt-16">
        <h2 className="text-3xl font-bold tracking-tight mb-8">
          Customers's Saying
        </h2>
        <div className="flex items-center space-x-4 mb-8">
          <div className="flex text-yellow-400">
            {"★".repeat(Math.floor(tour.avgRating))}
            {"☆".repeat(5 - Math.floor(tour.avgRating))}
          </div>
          <span className="text-2xl font-semibold text-gray-800">
            {tour.avgRating.toFixed(1)}
          </span>
          <span className="text-gray-500 text-sm">
            Based on {tour.reviewCount}{" "}
            {tour.reviewCount === 1 ? "review" : "reviews"}
          </span>
        </div>

        {tour.reviewComments.length > 0 ? (
          <div className="space-y-8">
            {tour.reviewComments.map((comment, index) => (
              <div key={index} className="relative p-6 bg-gray-50 rounded-lg">
                <p className="italic text-gray-600 before:content-['“'] after:content-['”']">
                  {comment}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <p className="text-gray-600 font-medium">
              This tour has no reviews yet.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Be the first to leave a review and help other travelers!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
// issues to fix
// tour id im not getting it
// review should be an array but there is an issue  why does it get me a review
