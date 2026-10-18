"use client";

import { uploadBase64ImageToFirebase } from "@/utils/utils";
import { teamMemberSchema } from "@/validation/teamMember";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { z } from "zod";

type TeamMemberFormData = z.infer<typeof teamMemberSchema>;
const emptyMember = { name: "", email: "", title: "", image: "" };

export default function AdminTeamMember() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const submitting = useRef(false);
  const imageReader = useRef<FileReader | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const updateId: string = searchParams.get("update") || "";
  const isLoading = loadedId !== updateId;

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: emptyMember,
  });

  useEffect(() => {
    const controller = new AbortController();
    imageReader.current?.abort();
    setIsReadingImage(false);
    reset(emptyMember);
    setImagePreview(null);
    setErrorMessage("");
    setSuccessMessage("");
    setLoadedId(null);
    const setUpdateDefault = async () => {
      try {
        if (updateId) {
          const res = await axios.get(`/api/team/query/${updateId}`, {
            signal: controller.signal,
          });
          if (controller.signal.aborted) return;
          reset(res.data);
          setImagePreview(res.data.image);
        }
        setLoadedId(updateId);
      } catch {
        if (!controller.signal.aborted) {
          setErrorMessage(
            "Unable to load this member. Please reload and try again.",
          );
        }
      }
    };

    setUpdateDefault();
    return () => {
      controller.abort();
      imageReader.current?.abort();
    };
  }, [reset, updateId]);

  const onDropAccepted = useCallback(
    (acceptedFiles: File[]) => {
      imageReader.current?.abort();
      const reader = new FileReader();
      imageReader.current = reader;
      setIsReadingImage(true);
      reader.onload = () => {
        const base64 = reader.result as string;
        setValue("image", base64, { shouldValidate: true });
        setImagePreview(base64);
        setIsReadingImage(false);
        setSuccessMessage("");
      };
      reader.onerror = () => {
        setIsReadingImage(false);
        setError("image", {
          message: "Unable to read this image. Please try another file.",
        });
      };
      reader.readAsDataURL(acceptedFiles[0]);
    },
    [setValue, setError],
  );

  const onDropRejected = useCallback(() => {
    setError("image", {
      type: "validate",
      message: "Please select one JPEG or PNG image.",
    });
  }, [setError]);

  const { getRootProps, getInputProps } = useDropzone({
    onDropAccepted,
    onDropRejected,
    multiple: false,
    disabled: isLoading || isSubmitting || isReadingImage,
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
    },
  });

  const onSubmit = async (data: TeamMemberFormData) => {
    if (submitting.current || isLoading || isReadingImage) return;
    submitting.current = true;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      setIsSubmitting(true);
      const { name, email, title, image } = data;
      let imageUrl;

      if (!image.startsWith("data:")) {
        imageUrl = image;
      } else {
        imageUrl = await uploadBase64ImageToFirebase(
          image,
          `${name}-${crypto.randomUUID()}`,
          "team-members",
        );
        // Reuse this upload if saving fails and the editor retries.
        setValue("image", imageUrl);
        setImagePreview(imageUrl);
      }

      const body = {
        name: name,
        email: email,
        title: title,
        image: imageUrl,
      };

      if (updateId) {
        await axios.put(`/api/team/update/${updateId}`, body);
      } else {
        await axios.post("/api/team/create", body);
      }
      if (updateId) {
        router.push("/team");
      } else {
        reset(emptyMember);
        setImagePreview(null);
        setSuccessMessage(
          "Team member added. You can add another member below.",
        );
      }
    } catch (error) {
      setErrorMessage(
        axios.isAxiosError(error) &&
          typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "Unable to save this member. Please try again.",
      );
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  const CameraIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="30"
      height="30"
      fill="gray"
      className="bi bi-camera-fill"
      viewBox="0 0 16 16"
    >
      <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
      <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0" />
    </svg>
  );

  return (
    <div className="h-full flex items-center justify-center bg-white m-8">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-xl w-full bg-white p-8 border-2 border-ennovate-gray shadow-xl rounded-lg"
      >
        <p className="mt-2 text-4xl text-center font-extrabold tracking-tight text-ennovate-dark-blue sm:text-5xl mb-6">
          Member {updateId ? "Updates" : "Registration"}
        </p>
        {errorMessage && (
          <p role="alert" className="mb-4 text-red-600">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p role="status" className="mb-4 text-ennovate-main">
            {successMessage}
          </p>
        )}
        {isLoading && !errorMessage && <p role="status">Loading member...</p>}
        <fieldset disabled={isLoading || isSubmitting}>
          <div className="mb-5">
            <label
              htmlFor="name"
              className="block mb-2 text-lg font-bold text-ennovate-dark-blue"
            >
              Member Name
            </label>
            <input
              id="name"
              {...register("name")}
              className={`bg-white border ${
                errors.name ? "border-red-500" : "border-ennovate-gray"
              } text-ennovate-main text-sm rounded-md focus:ring-ennovate-main focus:border-ennovate-main block w-full p-2.5`}
              placeholder="Ennovate Member"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-2">{errors.name.message}</p>
            )}
          </div>
          <div className="mb-5">
            <label
              htmlFor="email"
              className="block mb-2 text-lg font-bold text-ennovate-dark-blue"
            >
              Member Email
            </label>
            <input
              type="email"
              id="email"
              {...register("email")}
              className={`bg-white border ${
                errors.email ? "border-red-500" : "border-ennovate-gray"
              } text-ennovate-main text-sm rounded-md focus:ring-ennovate-main focus:border-ennovate-main block w-full p-2.5`}
              placeholder="ennovateteam@gmail.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-2">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="mb-5">
            <label
              htmlFor="title"
              className="block mb-2 text-lg font-bold text-ennovate-dark-blue"
            >
              Member Title
            </label>
            <input
              id="title"
              {...register("title")}
              className={`bg-white border ${
                errors.title ? "border-red-500" : "border-ennovate-gray"
              } text-ennovate-main text-sm rounded-md focus:ring-ennovate-main focus:border-ennovate-main block w-full p-2.5`}
              placeholder="Project Director"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-2">
                {errors.title.message}
              </p>
            )}
          </div>
          <div className="mb-5">
            <label
              htmlFor="image"
              className="block mb-2 text-lg font-bold text-ennovate-dark-blue"
            >
              Member Image
            </label>
            <div
              {...getRootProps()}
              className={`bg-white border ${
                errors.image ? "border-red-500" : "border-ennovate-gray"
              } text-ennovate-main text-sm rounded-md focus:ring-ennovate-main focus:border-ennovate-main block w-full h-64 flex items-center justify-center cursor-pointer`}
            >
              <input {...getInputProps()} />
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full w-full object-contain rounded-md"
                />
              ) : (
                <CameraIcon />
              )}
            </div>
            {errors.image && (
              <p className="text-red-500 text-sm mt-2">
                {errors.image.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="text-white text-lg font-bold bg-ennovate-main rounded-lg w-full px-5 py-2.5 text-center"
            style={{ opacity: isSubmitting ? 0.7 : 1 }}
            disabled={isSubmitting || isReadingImage || isLoading}
          >
            {isSubmitting
              ? updateId
                ? "Updating..."
                : "Submitting..."
              : updateId
                ? "Update"
                : "Submit"}
          </button>
        </fieldset>
      </form>
    </div>
  );
}
