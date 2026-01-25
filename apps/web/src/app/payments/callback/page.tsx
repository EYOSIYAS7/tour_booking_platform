"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
// Assuming you are using the auth store we saw in your directory structure
import { useAuthStore } from "@/store/auth.store";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Read the auth store and derive the token using common keys to avoid TypeScript errors
  const auth = useAuthStore();
  const accessToken: string | undefined =
    (auth as any).accessToken ??
    (auth as any).token ??
    (auth as any).access_token;

  const [status, setStatus] = useState<
    "loading" | "success" | "failed" | "pending"
  >("loading");
  const [message, setMessage] = useState("Verifying your payment...");

  const txRef = searchParams.get("tx_ref");
  console.log(txRef);
  const bookingId = searchParams.get("booking_id");

  useEffect(() => {
    // 1. Validation check
    if (!txRef || !bookingId) {
      setStatus("failed");
      console.log(txRef, bookingId);
      setMessage("Missing payment information in the URL.");
      return;
    }

    // 2. Auth check
    if (!accessToken) {
      setStatus("failed");
      setMessage("Authentication session not found. Please log in.");
      return;
    }

    const verify = async () => {
      try {
        // We use your POST /verify route as it's the standard for Chapa refs
        const response = await fetch(
          `http://localhost:4000/payment/verify-booking/${bookingId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`, // Crucial for your @UseGuards
            },
            body: JSON.stringify({
              transactionReference: txRef,
            }),
          },
        );

        const result = await response.json();

        // Matching your backend's return structure
        if (result.status === "success") {
          setStatus("success");
          setMessage(result.message);
          setTimeout(() => router.push(`/my-bookings/${bookingId}`), 4000);
        } else if (result.status === "failed") {
          setStatus("failed");
          setMessage(result.message || "Payment verification failed.");
        } else {
          setStatus("pending");
          setMessage(result.message || "Verification is pending.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("failed");
        setMessage(
          "Unable to connect to the server. Please check your connection.",
        );
      }
    };

    verify();
  }, [txRef, bookingId, accessToken, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 border border-gray-50 text-center">
        {status === "loading" && (
          <div className="space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-blue-50 border-t-blue-600 animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Finalizing Booking
            </h2>
            <p className="text-gray-500 animate-pulse">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-center h-20 w-20 bg-green-50 rounded-full mx-auto">
              <svg
                className="h-10 w-10 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              It's Official!
            </h2>
            <p className="text-green-700 font-medium bg-green-50 py-2 px-4 rounded-lg inline-block">
              {message}
            </p>
            <p className="text-gray-500 text-sm">
              Redirecting you to your itinerary...
            </p>
          </div>
        )}

        {status === "failed" && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-center h-20 w-20 bg-red-50 rounded-full mx-auto">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Something went wrong
            </h2>
            <p className="text-red-500 bg-red-50 p-3 rounded-xl text-sm">
              {message}
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition"
              >
                Retry Verification
              </button>
              <Link
                href="/my-bookings"
                className="text-gray-500 font-semibold hover:text-gray-800 transition"
              >
                View My Bookings
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
