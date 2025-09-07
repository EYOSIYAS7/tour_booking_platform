// apps/web/src/components/TourList.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useState } from "react";
import {
  BookOpenIcon,
  GlobeAltIcon,
  StarIcon,
  PlayIcon,
} from "@heroicons/react/24/solid"; // Example using heroicons
import Link from "next/link";

// Define a type for our tour data for type-safety
type Tour = {
  id: string;
  name: string;
  location: string;
  price: number;
  description: string;
  imageUrl: string;
  reviewCount: number;
  avgRating: number;
};

// The function that fetches the data remains the same
const getTours = async (): Promise<Tour[]> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }
  const response = await fetch(`${apiUrl}/tours`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

// --- UI Components defined inline for simplicity ---

const SkeletonCard = () => (
  <div className="rounded-xl bg-white shadow-lg animate-pulse">
    <div className="w-full h-48 bg-gray-300 rounded-t-xl"></div>
    <div className="p-6">
      <div className="h-6 w-3/4 mb-4 bg-gray-300 rounded"></div>
      <div className="h-4 w-full mb-2 bg-gray-200 rounded"></div>
      <div className="h-4 w-5/6 mb-6 bg-gray-200 rounded"></div>
      <div className="flex justify-between items-center">
        <div className="h-8 w-1/4 bg-gray-300 rounded"></div>
        <div className="h-10 w-1/3 bg-gray-300 rounded-md"></div>
      </div>
    </div>
  </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="max-w-md mx-auto bg-red-50 border border-red-200 p-6 rounded-lg text-center">
    <h3 className="text-lg font-semibold text-red-800">Something went wrong</h3>
    <p className="text-red-600 mt-2">{message}</p>
  </div>
);

export default function TourList() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tours"],
    queryFn: getTours,
  });

  const [file, setFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const bookingMutation = useMutation({
    mutationFn: (tourId: string) => {
      return fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tourId }),
      });
    },
    onSuccess: () => {
      // In a real app, use a toast library like react-hot-toast
      alert("Tour booked successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (tourId: string) => {
      if (!file) throw new Error("No file selected");
      const formData = new FormData();
      formData.append("file", file);
      return fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tours/${tourId}/upload-image`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );
    },
    onSuccess: () => {
      alert("Image uploaded!");
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      setFile(null);
      setSelectedFileName("");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setSelectedFileName(selectedFile ? selectedFile.name : "");
  };

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-12">
          Finding Amazing Adventures...
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <ErrorDisplay message={error.message} />
      </div>
    );
  }

  return (
    <div className=" min-h-[80vh]">
      <div className="w-full max-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-50 tracking-tight sm:text-5xl">
            Explore Our World-Class Tours
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Unforgettable journeys crafted for the modern explorer.
          </p>
        </div>

        {data && data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.map((tour) => (
              <Link href={`/tours/${tour.id}`} key={tour.id}>
                <div
                  key={tour.id}
                  className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-white flex flex-col group"
                >
                  <div className="relative">
                    <img
                      src={
                        tour.imageUrl ||
                        "https://placehold.co/600x400/EEE/31343C?text=Tour+Image"
                      }
                      alt={tour.name}
                      className="w-full h-56 object-cover transform group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-800 flex items-center">
                      <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                      {tour.avgRating.toFixed(1)}
                      <span className="text-gray-500 ml-1">
                        ({tour.reviewCount})
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider flex items-center">
                      <GlobeAltIcon className="w-4 h-4 mr-2" />
                      {tour.location}
                    </p>
                    <h2 className="text-2xl font-bold text-gray-900 my-2">
                      {tour.name}
                    </h2>
                    <p className="text-gray-600 line-clamp-3 flex-grow">
                      {tour.description}
                    </p>

                    <div className="mt-6 flex justify-between items-center">
                      <span className="text-3xl text-gray-900 font-bold">
                        ${tour.price}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    {isAuthenticated && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <button
                          onClick={() => bookingMutation.mutate(tour.id)}
                          disabled={bookingMutation.isPending}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <BookOpenIcon className="w-5 h-5 mr-2" />
                          {bookingMutation.isPending
                            ? "Booking..."
                            : "Book Now"}
                        </button>

                        {/* Improved File Upload UI */}
                        <div className="mt-4 text-center">
                          <label
                            htmlFor={`file-upload-${tour.id}`}
                            className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            Update Tour Image
                          </label>
                          <input
                            id={`file-upload-${tour.id}`}
                            type="file"
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                          {selectedFileName && (
                            <p className="text-xs text-gray-500 mt-2 truncate">
                              Selected: {selectedFileName}
                            </p>
                          )}

                          {file && (
                            <button
                              onClick={() => uploadMutation.mutate(tour.id)}
                              disabled={uploadMutation.isPending}
                              className="mt-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-md text-sm disabled:opacity-50 flex items-center justify-center"
                            >
                              <PlayIcon className="w-4 h-4 mr-2" />
                              {uploadMutation.isPending
                                ? "Uploading..."
                                : "Confirm Upload"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-gray-700">
              No Tours Found
            </h2>
            <p className="text-gray-500 mt-2">
              We couldn't find any available tours at the moment. Please check
              back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
