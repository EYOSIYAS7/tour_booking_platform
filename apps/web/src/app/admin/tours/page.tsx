// Create new file at: apps/web/src/app/admin/tours/page.tsx

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";

// --- Type Definitions ---
type TourProvider = { email: string };
type Tour = {
  id: string;
  name: string;
  location: string;
  price: number;
  provider: TourProvider;
};

// --- Zod Schema for the Edit Form ---
const tourSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().int().positive("Price must be a positive number"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});
type TourFormValues = z.infer<typeof tourSchema>;

// --- API Fetching Function ---
const getAdminTours = async (): Promise<Tour[]> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/tours/admin/all`,
    {
      credentials: "include",
    }
  );
  if (!response.ok) throw new Error("Failed to fetch tours");
  return response.json();
};

// --- The Main Page Component ---
export default function AdminToursPage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TourFormValues>({
    resolver: zodResolver(tourSchema),
  });

  // --- Data Fetching ---
  const {
    data: tours,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-tours"],
    queryFn: getAdminTours,
  });

  // --- API Mutation for Deleting a Tour ---
  const deleteMutation = useMutation({
    mutationFn: (tourId: string) => {
      return fetch(`${process.env.NEXT_PUBLIC_API_URL}/tours/admin/${tourId}`, {
        method: "DELETE",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tours"] });
      setIsDeleteModalOpen(false);
    },
  });

  // --- API Mutation for Updating a Tour ---
  const updateMutation = useMutation({
    mutationFn: (data: TourFormValues) => {
      if (!selectedTour) throw new Error("No tour selected");
      return fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tours/admin/${selectedTour.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tours"] });
      setIsEditModalOpen(false);
    },
  });

  // --- Event Handlers ---
  const openEditModal = (tour: Tour) => {
    setSelectedTour(tour);
    // Note: We don't have the full tour object to pre-fill the form,
    // in a real app, we'd fetch the full tour details here.
    // For now, we'll reset with the basics.
    reset({
      name: tour.name,
      location: tour.location,
      price: tour.price,
      description: "",
      startDate: "",
      endDate: "",
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (tour: Tour) => {
    setSelectedTour(tour);
    setIsDeleteModalOpen(true);
  };

  const onUpdateSubmit = (data: TourFormValues) => {
    updateMutation.mutate(data);
  };

  // --- INLINE UI COMPONENTS FOR LOADING, ERROR, AND EMPTY STATES ---
  const TableSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm"
        >
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-gray-200"></div>
            <div className="space-y-2">
              <div className="h-4 w-48 bg-gray-200 rounded"></div>
              <div className="h-3 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded-md"></div>
        </div>
      ))}
    </div>
  );

  const ErrorState = ({ message }: { message: string }) => (
    <div className="text-center py-16 px-6 bg-white rounded-xl shadow-sm">
      <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
      <h3 className="mt-4 text-lg font-semibold text-gray-800">
        Something went wrong
      </h3>
      <p className="mt-2 text-sm text-red-600">{message}</p>
    </div>
  );

  const EmptyState = ({ onAddTour }: { onAddTour: () => void }) => (
    <div className="text-center py-16 px-6 bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200">
      <h3 className="text-xl font-bold text-gray-800">No Tours Found</h3>
      <p className="mt-2 text-gray-500">
        Get started by adding your first tour.
      </p>
      <button
        onClick={onAddTour}
        className="mt-6 inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Add New Tour
      </button>
    </div>
  );

  // --- MAIN COMPONENT RETURN ---
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Tours</h1>
        <TableSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-4 sm:p-8">
        <ErrorState message={"Failed to load tours."} />
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Manage Tours
              </h1>
              <p className="mt-1 text-gray-600">
                View, edit, and delete your tour listings.
              </p>
            </div>
            <button
              // onClick={() => openCreateModal()} // Assuming you have a create modal
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Tour
            </button>
          </div>

          {tours && tours.length > 0 ? (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Location
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Price
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Provider
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tours.map((tour) => (
                    <tr
                      key={tour.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {tour.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tour.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${tour.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                            {tour.provider.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">{tour.provider.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        <button
                          onClick={() => openEditModal(tour)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          title="Edit Tour"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(tour)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete Tour"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              onAddTour={() => {
                /* openCreateModal() */
              }}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedTour && (
        <div
          className="fixed inset-0 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300">
            <div className="p-6 text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-4 text-xl font-bold text-gray-900">
                Confirm Deletion
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to delete the tour "{selectedTour.name}"?
                This action cannot be undone.
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-4 rounded-b-xl">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(selectedTour.id)}
                disabled={deleteMutation.isPending}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Tour"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tour Modal */}
      {isEditModalOpen && selectedTour && (
        <div
          className="fixed inset-0 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        >
          <form
            onSubmit={handleSubmit(onUpdateSubmit)}
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300"
          >
            <div className="p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900">Edit Tour</h2>
              <p className="mt-1 text-sm text-gray-500">
                Update the details for "{selectedTour.name}".
              </p>
              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Name
                  </label>
                  <input
                    {...register("name")}
                    id="name"
                    type="text"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Location
                  </label>
                  <input
                    {...register("location")}
                    id="location"
                    type="text"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.location.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Price
                  </label>
                  <input
                    {...register("price", { valueAsNumber: true })}
                    id="price"
                    type="number"
                    step="0.01"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.price.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-4 rounded-b-xl">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
