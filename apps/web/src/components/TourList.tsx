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

  if (isLoading) {
    return <div className="text-center">Loading tours...</div>;
  }

  if (isError) {
    return (
      <div className="text-center text-red-500">Error: {error.message}</div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12 min-h-[80vh] rounded-2xl shadow-xl ">
      <h1 className="text-4xl font-extrabold mb-10 text-center tracking-tight text-gray-900">
        <span className="inline-block align-middle mr-2"></span>
        <span className="align-middle text-amber-50">Explore Tours</span>
      </h1>
      {data && data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.map((tour) => (
            <div
              key={tour.id}
              className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 flex flex-col gap-3 hover:scale-[1.025] transition-transform"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-lg text-gray-900 truncate">
                  {tour.name}
                </h2>
                <span className="bg-gray-100 text-gray-600 text-xs px-3 py-0.5 rounded-full font-medium">
                  {tour.location}
                </span>
              </div>
              <p className="text-gray-500 text-sm line-clamp-3 mb-4">
                {tour.description}
              </p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-xl font-bold text-indigo-600">
                  ${tour.price}
                </span>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-1.5 rounded-lg shadow-sm transition-colors duration-150">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 text-lg mt-20">
          No tours available at the moment.
        </p>
      )}
    </div>
  );
}
