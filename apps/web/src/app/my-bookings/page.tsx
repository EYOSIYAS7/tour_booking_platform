"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ReviewModal from "@/components/ReviewModal";
import {
  MapPinIcon,
  CalendarDaysIcon,
  PencilSquareIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";

// Define types for clarity, adding imageUrl to Tour
type Tour = {
  id: string;
  name: string;
  location: string;
  description: string;
  imageUrl?: string;
};
type Booking = {
  id: string;
  bookingDate: string;
  tour: Tour;
  hasReviewed?: boolean;
};

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

const BookingCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden flex animate-pulse">
    <div className="w-1/3 bg-gray-200"></div>
    <div className="p-6 flex-1">
      <div className="h-6 w-3/4 bg-gray-200 rounded mb-3"></div>
      <div className="h-4 w-1/2 bg-gray-200 rounded mb-4"></div>
      <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
      <div className="mt-6 h-10 w-32 bg-gray-200 rounded-lg ml-auto"></div>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-16 px-6 bg-white rounded-xl shadow-sm">
    <h2 className="text-2xl font-bold text-gray-800">No Bookings Yet</h2>
    <p className="mt-2 text-gray-500">
      Your adventure awaits! Once you book a tour, it will appear here.
    </p>
    <a
      href="/"
      className="mt-6 inline-block px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
    >
      Explore Tours
    </a>
  </div>
);

export default function MyBookingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const {
    data: bookings,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: getMyBookings,
  });

  const handleOpenReviewModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setSelectedBooking(null);
    setIsModalOpen(false);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-center p-8 text-red-600 bg-red-50 rounded-lg">
          {error.message}
        </div>
      );
    }

    if (bookings && bookings.length > 0) {
      return (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-xl shadow-sm transition-shadow hover:shadow-md flex flex-col sm:flex-row overflow-hidden"
            >
              <img
                src={
                  booking.tour.imageUrl ||
                  "https://placehold.co/600x400/EEE/31343C?text=Tour"
                }
                alt={`Image of ${booking.tour.name}`}
                className="w-full sm:w-1/3 h-48 sm:h-auto object-cover"
              />
              <div className="p-6 flex flex-col flex-grow justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {booking.tour.name}
                  </h2>
                  <div className="flex flex-wrap items-center text-gray-600 mt-2 text-sm">
                    <div className="flex items-center mr-6">
                      <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{booking.tour.location}</span>
                    </div>
                    <div className="flex items-center">
                      <CalendarDaysIcon className="w-4 h-4 mr-2 text-gray-400" />
                      <span>
                        Booked on:{" "}
                        {new Date(booking.bookingDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center mr-6 mt-6">
                      <span>{booking.tour.description}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-right">
                  {booking.hasReviewed ? (
                    <div className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-full">
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      Reviewed
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenReviewModal(booking)}
                      className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                      <PencilSquareIcon className="w-5 h-5 mr-2" />
                      Leave a Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return <EmptyState />;
  };

  return (
    <>
      <main className="bg-gray-50 min-h-screen">
        <div className="container mx-auto max-w-4xl p-4 sm:p-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-8 tracking-tight">
            My Bookings
          </h1>
          {renderContent()}
        </div>
      </main>

      <ReviewModal
        booking={selectedBooking}
        isOpen={isModalOpen}
        onClose={handleCloseReviewModal}
      />
    </>
  );
}
