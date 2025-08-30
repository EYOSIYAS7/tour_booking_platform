// Updated: apps/web/src/app/login/page.tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

// defines the validation schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// This function now uses fetch to get the user's data that is going to be used in tanstack query to fetch user data after login
const getMe = async () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}/users/me`, {
    credentials: "include", // Crucial for sending cookies
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  return response.json();
};

export default function LoginPage() {
  const router = useRouter();
  const loginToStore = useAuthStore((state) => state.login);
  const queryClient = useQueryClient();

  // useForm hook to manage form state and validation using zod schema
  // with zodResolver to integrate zod with react-hook-form
  // Destructure register, handleSubmit, and formState from useForm
  // register is used to register input fields,
  // handleSubmit
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // this is function is used to make login request that is going to be used by mutate function of tanstack query
  const loginUser = async (data: LoginFormValues) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${apiUrl}/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include", // Crucial for receiving cookies
    });

    if (!response.ok) {
      throw new Error("Invalid credentials");
    }
    return response.json();
  };

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: async () => {
      const userData = await queryClient.fetchQuery({
        queryKey: ["me"],
        queryFn: getMe,
      });
      loginToStore(userData);
      router.push("/");
    },
  });

  // this is called by handleSubmit after it validates the user data by the schema that is defined using zod
  const onSubmit = (data: LoginFormValues) => {
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
            Welcome Back
          </h2>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
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
            autoComplete="email"
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
            autoComplete="current-password"
            // register
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
          {mutation.isPending ? "Logging In..." : "Login"}
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
