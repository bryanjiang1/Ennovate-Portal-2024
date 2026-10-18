"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const blogSchema = z.object({
  mediumUrl: z.string().url("Invalid Medium URL"),
  featured: z.boolean().optional(),
});

type BlogFormData = z.infer<typeof blogSchema>;

export default function AdminBlog() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const updateId: string = searchParams.get("update") || "";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
  });

  useEffect(() => {
    const setUpdateDefault = async () => {
      if (updateId) {
        const res = await axios.get(`/api/blog/query/${updateId}`);
        const blog = res.data;

        reset({
          mediumUrl: blog.mediumUrl,
          featured: blog.featured,
        });
      }
    };

    setUpdateDefault();
  }, [updateId, reset]);

  const onSubmit = async (data: BlogFormData) => {
    setIsSubmitting(true);

    const { mediumUrl, featured } = data;

    const body = {
      mediumUrl: mediumUrl,
      featured: featured,
    };

    try {
      if (updateId) {
        await axios.put(`/api/blog/update/${updateId}`, body);
      } else {
        await axios.post("/api/blog/create", body);
      }

      setIsSubmitting(false);
      reset();
      if (updateId) {
        window.location.href = "/resources/blog";
      }
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-white m-8">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-xl w-full bg-white p-8 border-2 border-ennovate-gray shadow-xl rounded-lg"
      >
        <p className="mt-2 text-4xl text-center font-extrabold tracking-tight text-ennovate-dark-blue sm:text-5xl mb-6">
          {updateId ? "Update Blog" : "Register Blog"}
        </p>
        <div className="mb-5">
          <label
            htmlFor="mediumUrl"
            className="block mb-2 text-lg font-bold text-ennovate-dark-blue"
          >
            Medium / LinkedIn URL
          </label>
          <input
            type="url"
            id="mediumUrl"
            {...register("mediumUrl")}
            className={`bg-white border ${errors.mediumUrl ? "border-red-500" : "border-ennovate-gray"
              } text-ennovate-main text-sm rounded-md focus:ring-ennovate-main focus:border-ennovate-main block w-full p-2.5`}
            placeholder="https://medium.com/@username/article"
          />
          {errors.mediumUrl && (
            <p className="text-red-500 text-sm mt-2">
              {errors.mediumUrl.message}
            </p>
          )}
        </div>

        <div className="mb-5 flex items-center">
          <label
            htmlFor="featured"
            className="text-lg font-bold text-ennovate-dark-blue"
          >
            Featured
          </label>
          <input
            type="checkbox"
            id="featured"
            {...register("featured")}
            className="h-5 w-5 text-ennovate-main rounded focus:ring-ennovate-main focus:border-ennovate-main ml-2"
          />
        </div>

        <button
          type="submit"
          className="text-white text-lg font-bold bg-ennovate-main rounded-lg w-full px-5 py-2.5 text-center"
          style={{ opacity: isSubmitting ? 0.7 : 1 }}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? updateId
              ? "Updating..."
              : "Submitting..."
            : updateId
              ? "Update"
              : "Submit"}
        </button>
      </form>
    </div>
  );
}
