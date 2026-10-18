"use client";

import {
  generateDrivePreviewURL,
  uploadBase64ImageToFirebase,
  validateFirebaseImageLink,
} from "@/utils/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { z } from "zod";

const businessProposalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  drive: z.string().url("Invalid Google Drive link"),
  image: z.string().min(1, "Image is required"),
});

type BusinessProposalFormData = z.infer<typeof businessProposalSchema>;

export default function AdminBusinessProposal() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const updateId: string = searchParams.get("update") || "";

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<BusinessProposalFormData>({
    resolver: zodResolver(businessProposalSchema),
  });

  useEffect(() => {
    const setUpdateDefault = async () => {
      if (updateId) {
        console.log(updateId);
        const res = await axios.get(
          `/api/business-proposals/query/${updateId}`
        );
        const businessProposal = res.data;

        reset({
          name: businessProposal.name,
          description: businessProposal.description,
          drive: businessProposal.drive,
          image: businessProposal.image,
        });

        setImagePreview(businessProposal.image);
      }
    };

    setUpdateDefault();
  }, [updateId]);

  // use callback to apply memoization

  const onDropAccepted = useCallback(
    (acceptedFiles: File[]) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setValue("image", base64, { shouldValidate: true });
        setImagePreview(base64);
      };
      reader.readAsDataURL(acceptedFiles[acceptedFiles.length - 1]);
    },
    [setValue]
  );

  const onDropRejected = useCallback((rejectedFiles: FileRejection[]) => {
    rejectedFiles.forEach((f: FileRejection) => {
      setError("image", {
        "type": "validate",
        "message": `Invalid file type! Only jpeg, jpg and png are accepted.`
      })
    })
  }, [setValue]);

  const { getRootProps, getInputProps } = useDropzone({
    onDropAccepted,
    onDropRejected,
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
    }
  });

  const onSubmit = async (data: BusinessProposalFormData) => {
    try {
      setIsSubmitting(true);
      const { name, description, drive, image } = data;
      let imageUrl;

      if (updateId && validateFirebaseImageLink(image)) {
        imageUrl = image;
      } else {
        imageUrl = await uploadBase64ImageToFirebase(
          image,
          name,
          "business-proposals"
        );
      }

      const driveUrl = generateDrivePreviewURL(drive);

      const body = {
        name: name,
        description: description,
        drive: driveUrl,
        image: imageUrl,
      };

      if (updateId) {
        await axios.put(`/api/business-proposals/update/${updateId}`, body);
      } else {
        await axios.post("/api/business-proposals/create", body);
      }
      setIsSubmitting(false);
      reset();
      setImagePreview(null);

      if (updateId) {
        window.location.href = "/resources/business-proposals";
      }
    } catch (e) {
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
          {updateId ? "Update Business Report" : "Register Business Report"}
        </p>
        <div className="mb-5">
          <label
            htmlFor="name"
            className="block mb-2 text-lg font-bold text-ennovate-dark-blue"
          >
            Business Report Name
          </label>
          <input
            id="name"
            {...register("name")}
            className={`bg-white border ${errors.name ? "border-red-500" : "border-ennovate-gray"
              } text-ennovate-main text-sm rounded-md focus:ring-ennovate-main focus:border-ennovate-main block w-full p-2.5`}
            placeholder="Ennovate UBC"
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
            Business Report Description
          </label>
          <input
            id="description"
            {...register("description")}
            className={`bg-white border ${errors.description ? "border-red-500" : "border-ennovate-gray"
              } text-ennovate-main text-sm rounded-md focus:ring-ennovate-main focus:border-ennovate-main block w-full p-2.5`}
            placeholder="2nd Place 24/25 Sem 1"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-2">{errors.description.message}</p>
          )}
        </div>
        <div className="mb-5">
          <label
            htmlFor="drive"
            className="block mb-2 text-lg font-bold text-ennovate-dark-blue"
          >
            Google Drive Link
          </label>
          <input
            type="url"
            id="drive"
            {...register("drive")}
            className={`bg-white border ${errors.drive ? "border-red-500" : "border-ennovate-gray"
              } text-ennovate-main text-sm rounded-md focus:ring-ennovate-main focus:border-ennovate-main block w-full p-2.5`}
            placeholder="https://drive.google.com/file/d/FILE_ID/view?usp=sharing"
          />
          {errors.drive && (
            <p className="text-red-500 text-sm mt-2">{errors.drive.message}</p>
          )}
        </div>
        <div className="mb-5">
          <label
            htmlFor="image"
            className="block mb-2 text-lg font-bold text-ennovate-dark-blue"
          >
            Business Report Image
          </label>
          <div
            {...getRootProps()}
            className={`bg-white border ${errors.image ? "border-red-500" : "border-ennovate-gray"
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
            <p className="text-red-500 text-sm mt-2">{errors.image.message}</p>
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
