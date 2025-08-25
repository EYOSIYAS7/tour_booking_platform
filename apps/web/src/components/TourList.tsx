// apps/web/src/components/TourList.tsx
"use client";

import { useQuery } from "@tanstack/react-query";

// Define a type for our tour data for type-safety
type Tour = {
  id: string;
  name: string;
  location: string;
  price: number;
  description: string;
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
  return response.json();
};

export default function TourList() {
  // useQuery remains exactly the same. It doesn't care HOW we fetch the data,
  // only that the queryFn returns a promise.
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tours"],
    queryFn: getTours,
  });

  if (isLoading) {
    return <div className="text-center">Loading tours...</div>;
  }

  if (isError) {
    return (
      <div className="text-center text-red-500">Error: {error.message}</div>
    );
  }

  return (
    <div className="w-full max-w-5xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Available Tours</h1>
      {data && data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((tour) => (
            <div
              key={tour.id}
              className="bg-white border border-slate-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h2 className="font-semibold text-xl mb-2">{tour.name}</h2>
              <p className="text-slate-600 mb-1">Location: {tour.location}</p>
              <p className="text-slate-800 font-medium text-lg">
                ${tour.price}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-slate-500">
          No tours available at the moment.
        </p>
      )}
    </div>
  );
}
