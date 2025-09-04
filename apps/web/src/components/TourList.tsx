// apps/web/src/components/TourList.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

// Define a type for our tour data for type-safety
type Tour = {
  id: string;
  name: string;
  location: string;
  price: number;
  description: string;
  imageUrl: string; // Add image URL
};

// The function that fetches the data using the native fetch API
const getTours = async (): Promise<Tour[]> => {
  // We get the API URL from the environment variable
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await fetch(`${apiUrl}/tours`);

  // fetch doesn't automatically throw an error for bad HTTP status codes
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  // We need to manually parse the JSON from the response
  // parse is converting the JSON string into a JavaScript object that we can use in our code
  return response.json();
};

export default function TourList() {
  // useQuery remains exactly the same. It doesn't care HOW we fetch the data,
  // only that the queryFn returns a promise.
  // useQuery automatically handles loading and error states for us. and  manages caching, refetching, and more.
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tours"],
    queryFn: getTours,
  });
  const [file, setFile] = useState<File | null>(null);
  const bookingMutation = useMutation({
    mutationFn: (tourId: string) => {
      return fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tourId }), // Send the tourId in the request body, that was required by the backend by the DTO
      });
    },
    onSuccess: () => {
      // Optionally, invalidate queries to refetch data, e.g., user's bookings
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      alert("Tour booked successfully!");
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (tourId: string) => {
      if (!file) throw new Error("No file selected");

      const formData = new FormData();
      formData.append("file", file); // 'file' must match the name in FileInterceptor

      return fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tours/${tourId}/upload-image`,
        {
          method: "POST",
          credentials: "include", // Important for sending our auth cookie
          body: formData,
          // DO NOT set Content-Type header manually when using FormData
        }
      );
    },
    onSuccess: () => {
      alert("Image uploaded!");
      queryClient.invalidateQueries({ queryKey: ["tours"] }); // Refetch tours to show new image
    },
  });

  const { isAuthenticated } = useAuthStore(); // from Zustand store
  const queryClient = useQueryClient();
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

  if (isLoading) {
    return <div className="text-center">Loading tours...</div>;
  }

  if (isError) {
    return (
      <div className="text-center text-red-500">Error: {error.message}</div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12 min-h-[80vh]">
      <h1 className="text-3xl font-semibold text-gray-800 text-center mb-8">
        Explore Our Tours
      </h1>
      {data && data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((tour) => (
            <div
              key={tour.id}
              className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-white"
            >
              <img
                src={tour.imageUrl || "https://via.placeholder.com/400x300"} // Use a placeholder if no image
                alt={tour.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  {tour.name}
                </h2>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {tour.description}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-gray-700 font-medium">
                    ${tour.price}
                  </span>
                  {isAuthenticated && (
                    <button
                      onClick={() => bookingMutation.mutate(tour.id)}
                      disabled={bookingMutation.isPending}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50"
                    >
                      {bookingMutation.isPending ? "Booking..." : "Book Now"}
                    </button>
                  )}

                  {isAuthenticated /* Assuming only logged-in users who own the tour can see this */ && (
                    <div className="mt-4 text-black">
                      <input
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                      <button onClick={() => uploadMutation.mutate(tour.id)}>
                        Upload
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 text-lg mt-10">
          No tours available at the moment.
        </p>
      )}
    </div>
  );
}
