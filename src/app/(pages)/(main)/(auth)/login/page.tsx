"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { sleep } from "@/utils/utils";
import { useAuth } from "@/hooks/useAuth";
import { captureException, captureMessage, withScope } from "@sentry/nextjs";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, login } = useAuth();
  const [isIncorrect, setIsInCorrect] = useState(false);
  const router = useRouter();

  if (isAuthenticated) {
    router.push("/admin");
  }
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      await login(data.email, data.password);
      setIsSubmitting(false);
      captureMessage(`Successful sign in attempt for user: ${data.email}`, "info")
    } catch (e) {
      setIsSubmitting(false);
      captureException(e);
      captureMessage(`Failed sign in attempt for user: ${data.email}`, "fatal");
      setIsInCorrect(true);
      await sleep(4000);
      setIsInCorrect(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-white mx-8">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-xl w-full bg-white p-8 border-2 border-ennovate-gray shadow-xl rounded-lg"
      >
        <p className="mt-2 text-4xl text-center font-extrabold tracking-tight text-ennovate-dark-blue sm:text-5xl mb-2">
          Admin Portal Login
        </p>
        <p className="mt-2 text-md text-center italic font-semibold tracking-tight text-ennovate-dark-blue sm:text-lg mb-6">
          WARNING: Ennovate & Enactus UBC members only
        </p>
        <div className="mb-5">
          <label
            htmlFor="email"
            className="block mb-2 text-lg font-bold text-ennovate-dark-blue"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            {...register("email")}
            className={`bg-white border ${errors.email ? "border-red-500" : "border-ennovate-gray"
              } text-ennovate-main text-sm rounded-md focus:ring-ennovate-main focus:border-ennovate-main block w-full p-2.5`}
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-2">{errors.email.message}</p>
          )}
        </div>
        <div className="mb-5">
          <label
            htmlFor="password"
            className="block mb-2 text-lg font-bold text-ennovate-dark-blue"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            {...register("password")}
            className={`bg-white border ${errors.password ? "border-red-500" : "border-ennovate-gray"
              } text-ennovate-main text-sm rounded-md focus:ring-ennovate-main focus:border-ennovate-main block w-full p-2.5`}
            placeholder="Enter your password"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-2">
              {errors.password.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          className="text-white text-lg font-bold bg-ennovate-main rounded-lg w-full px-5 py-2.5 text-center"
          style={{ opacity: isSubmitting ? 0.7 : 1 }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
        {isIncorrect && (
          <p className="text-red-500 text-sm mt-2">
            Incorrect email or password.
          </p>
        )}
      </form>
    </div>
  );
}
