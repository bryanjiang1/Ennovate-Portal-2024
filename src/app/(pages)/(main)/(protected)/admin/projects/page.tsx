"use client";

import { IBlogPopulated } from "@/models/Blog";
import { IBusinessProposal } from "@/models/BusinessProposal";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  presentationSlides: z.string().optional(),
  businessProposal: z.string().optional(),
  blog: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function AdminProjects() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessProposals, setBusinessProposals] = useState<IBusinessProposal[] | null>(null);
  const [blogs, setBlogs] = useState<IBlogPopulated[] | null>(null);

  const searchParams = useSearchParams();
  const updateId: string = searchParams.get("update") || "";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const businessProposalsRes = await axios.post("/api/business-proposals/read");
        const blogsRes = await axios.post("/api/blog/query", {});

        setBusinessProposals(businessProposalsRes.data);
        setBlogs(blogsRes.data);
      } catch (error) {
        console.error("Error fetching options", error);
      }
    };

    fetchOptions();

    if (updateId) {
      const fetchProjectData = async () => {
        try {
          const res = await axios.get(`/api/projects/query/${updateId}`);
          const project = res.data;

          reset({
            name: project.name,
            description: project.description,
            presentationSlides: project.presentationSlides || null,
          });
        } catch (error) {
          console.error("Error fetching project data", error);
        }
      };

      fetchProjectData();
    }
  }, [updateId, reset]);

  const onSubmit = async (data: ProjectFormData) => {
    try {
      setIsSubmitting(true);
      const { name, description, businessProposal, blog, presentationSlides } = data;

      const body = {
        name,
        description,
        presentationSlides: presentationSlides || null,
        businessProposal: businessProposal || null,
        blog: blog || null,
      };

      if (updateId) {
        await axios.put(`/api/projects/update/${updateId}`, body);
      } else {
        await axios.post("/api/projects/create", body);
      }

      setIsSubmitting(false);
      reset();

      if (updateId) {
        window.location.href = "/resources/projects";
      }
    } catch (e) {
      setIsSubmitting(false);
      console.error(e);
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-white m-8">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-xl w-full bg-white p-8 border-2 border-ennovate-gray shadow-xl rounded-lg"
      >
        <p className="mt-2 text-4xl text-center font-extrabold tracking-tight text-ennovate-dark-blue sm:text-5xl mb-6">
          {updateId ? "Update Project" : "Register Project"}
        </p>
        <div className="mb-5">
          <label
            htmlFor="name"
            className="block mb-2 text-lg font-bold text-ennovate-dark-blue"
          >
            Name
          </label>
          <input
            id="name"
            {...register("name")}
            className={`bg-white border ${errors.name ? "border-red-500" : "border-ennovate-gray"
              } text-ennovate-main text-sm rounded-md focus:ring-ennovate-main focus:border-ennovate-main block w-full p-2.5`}
            placeholder="Project Name"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-2">{errors.name.message}</p>
          )}
        </div>
        <div className="mb-5">
          <label
            htmlFor="description"
            className="block mb-2 text-lg font-bold text-ennovate-dark-blue"
          >
            Description
          </label>
          <input
            id="description"
            {...register("description")}
            className={`bg-white border ${errors.description ? "border-red-500" : "border-ennovate-gray"
              } text-ennovate-main text-sm rounded-md focus:ring-ennovate-main focus:border-ennovate-main block w-full p-2.5`}
            placeholder="Project Description"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-2">{errors.description.message}</p>
          )}
        </div>
        <div className="mb-5">
          <label
            htmlFor="presentationSlides"
            className="block mb-2 text-lg font-bold text-ennovate-dark-blue"
          >
            Presentation Slides
          </label>
          <input
            id="description"
            {...register("presentationSlides")}
            className={`bg-white border ${errors.presentationSlides ? "border-red-500" : "border-ennovate-gray"
              } text-ennovate-main text-sm rounded-md focus:ring-ennovate-main focus:border-ennovate-main block w-full p-2.5`}
            placeholder="Project Presentation Slides"
          />
          {errors.presentationSlides && (
            <p className="text-red-500 text-sm mt-2">{errors.presentationSlides.message}</p>
          )}
        </div>
        <div className="mb-5">
          <label
            htmlFor="businessProposal"
            className="block mb-2 text-lg font-bold text-ennovate-dark-blue"
          >
            Business Report
          </label>
          {!businessProposals ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : (
            <select
              id="businessProposal"
              {...register("businessProposal")}
              className={`bg-white border ${errors.businessProposal ? "border-red-500" : "border-ennovate-gray"
                } text-ennovate-main text-sm rounded-md focus:ring-ennovate-main focus:border-ennovate-main block w-full p-2.5`}
            >
              <option value="">None</option>
              {businessProposals.map((proposal: any) => (
                <option key={proposal._id} value={proposal._id}>
                  {proposal.name}
                </option>
              ))}
            </select>
          )}
          {errors.businessProposal && (
            <p className="text-red-500 text-sm mt-2">{errors.businessProposal.message}</p>
          )}
        </div>
        <div className="mb-5">
          <label
            htmlFor="blog"
            className="block mb-2 text-lg font-bold text-ennovate-dark-blue"
          >
            Blog
          </label>
          {!blogs ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : (
            <select
              id="blog"
              {...register("blog")}
              className={`bg-white border ${errors.blog ? "border-red-500" : "border-ennovate-gray"
                } text-ennovate-main text-sm rounded-md focus:ring-ennovate-main focus:border-ennovate-main block w-full p-2.5`}
            >
              <option value="">None</option>
              {blogs.map((blog: IBlogPopulated) => (
                <option key={blog.id} value={blog.id}>
                  {blog.title}
                </option>
              ))}
            </select>
          )}
          {errors.blog && (
            <p className="text-red-500 text-sm mt-2">{errors.blog.message}</p>
          )}
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
