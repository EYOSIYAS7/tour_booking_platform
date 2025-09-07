"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import StarRating from "./StarRating";
import { useEffect, useState } from "react";
import {
  XMarkIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";

// Define the shape of a booking that this modal accepts
type Booking = {
  id: string;
  tour: { id: string; name: string };
};

interface ReviewModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}

// Zod schema for form validation
const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating from 1 to 5 stars."),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters long.")
    .max(500, "Comment must be 500 characters or less."),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export default function ReviewModal({
  booking,
  isOpen,
  onClose,
}: ReviewModalProps) {
  const queryClient = useQueryClient();
  const [charCount, setCharCount] = useState(0);

  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: "" },
  });

  const commentValue = watch("comment");

  useEffect(() => {
    setCharCount(commentValue?.length || 0);
  }, [commentValue]);

  useEffect(() => {
    if (!isOpen) {
      // Delay reset to allow for closing animation
      setTimeout(() => {
        reset({ rating: 0, comment: "" });
      }, 300);
    }
  }, [isOpen, reset]);

  const mutation = useMutation({
    mutationFn: async (data: ReviewFormValues) => {
      if (!booking) throw new Error("No booking selected");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tours/${booking.tour.id}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit review");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      // In a real app, show a success toast
      alert("Thank you for your review!");
      onClose();
    },
  });

  const onSubmit = (data: ReviewFormValues) => {
    mutation.mutate(data);
  };

  if (!isOpen && !booking) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      onClick={onClose}
    >
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${isOpen ? "bg-opacity-60" : "bg-opacity-0"}`}
      ></div>
      <div
        className={`bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ${isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Share Your Experience
              </h2>
              <p className="text-indigo-600 font-semibold">
                {booking?.tour.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Rating
              </label>
              <Controller
                name="rating"
                control={control}
                render={({ field }) => (
                  <StarRating rating={field.value} setRating={field.onChange} />
                )}
              />
              {errors.rating && (
                <p className="text-red-600 text-sm mt-2">
                  {errors.rating.message}
                </p>
              )}
            </div>

            <div className="relative">
              <label
                htmlFor="comment"
                className="block text-sm font-medium text-gray-700"
              >
                Your Comment
              </label>
              <Controller
                name="comment"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    id="comment"
                    rows={5}
                    className={`mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.comment ? "border-red-500" : ""}`}
                    placeholder="Tell us about your trip..."
                  />
                )}
              />
              <div
                className={`absolute bottom-3 right-3 text-xs ${charCount > 500 ? "text-red-500" : "text-gray-400"}`}
              >
                {charCount} / 500
              </div>
              {errors.comment && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.comment.message}
                </p>
              )}
            </div>

            {mutation.isError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{mutation.error.message}</p>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center"
              >
                <PaperAirplaneIcon
                  className={`w-5 h-5 mr-2 ${mutation.isPending ? "animate-spin" : ""}`}
                />
                {mutation.isPending ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
