import { z } from "zod";

export const teamMemberSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email address"),
  title: z.string().trim().min(1, "Title is required"),
  image: z.string().min(1, "Image is required"),
});

export const savedTeamMemberSchema = teamMemberSchema.extend({
  image: z
    .string()
    .url("A valid image URL is required")
    .regex(/^https?:\/\//, "A saved image URL is required"),
});
