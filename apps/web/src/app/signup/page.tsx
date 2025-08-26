"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: SignupFormValues) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include", // Important for the server to be able to set cookies
      });

      if (!response.ok) {
        // You might want to parse the error message from the server here
        throw new Error("Signup failed. The email might already be in use.");
      }
      return response.json();
    },
    onSuccess: () => {
      router.push("/login");
    },
  });

  const onSubmit = (data: SignupFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md p-10 space-y-8 bg-white/80 rounded-3xl shadow-2xl border border-gray-100 backdrop-blur-lg"
      >
        <div className="flex flex-col items-center mb-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mb-2 shadow">
            <svg
              width="32"
              height="32"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="text-indigo-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4.418 0-8 1.79-8 4v2h16v-2c0-2.21-3.582-4-8-4z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-indigo-700 tracking-tight">
            Create Account
          </h2>
          <p className="text-gray-500 text-sm mt-1">Sign up to get started</p>
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-gray-600 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-gray-600 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">
              {errors.password.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-2 font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow hover:from-indigo-600 hover:to-purple-600 transition disabled:opacity-60"
        >
          {mutation.isPending ? "Signing Up..." : "Sign Up"}
        </button>
        {mutation.isError && (
          <p className="text-red-500 text-center text-sm">
            {mutation.error.message}
          </p>
        )}
      </form>
    </div>
  );
}
