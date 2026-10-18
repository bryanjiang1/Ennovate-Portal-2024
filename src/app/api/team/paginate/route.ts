import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import TeamMember from "@/models/TeamMember";
import { FilterQuery } from "mongoose";
import { TEAM_MEMBERS_PER_PAGE } from "@/constants/actions";
import { captureException } from "@sentry/nextjs";
import { z } from "zod";

const paginationSchema = z.object({
  query: z.string().default(""),
  currentPage: z.number().int().positive().default(1),
});

export async function POST(request: NextRequest) {
  try {
    const input = paginationSchema.safeParse(await request.json());
    if (!input.success) {
      return NextResponse.json(
        { message: "Invalid team search or page" },
        { status: 400 },
      );
    }
    const { query, currentPage } = input.data;

    await connectToDatabase();

    let queryObject: FilterQuery<typeof TeamMember> = {};
    // Read directly from MongoDB so edits cannot race with cache invalidation.
    const finalQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    if (query) {
      queryObject = {
        $or: [
          { name: { $regex: finalQuery, $options: "i" } },
          { title: { $regex: finalQuery, $options: "i" } },
        ],
      };
    }

    const skip = (currentPage - 1) * TEAM_MEMBERS_PER_PAGE;
    const limit = TEAM_MEMBERS_PER_PAGE;

    const [total, teamMembers] = await Promise.all([
      TeamMember.countDocuments(queryObject),
      TeamMember.find(queryObject)
        .sort({ _id: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
    ]);

    const res = {
      teamMembers: teamMembers,
      totalPages: Math.ceil(total / TEAM_MEMBERS_PER_PAGE),
    };

    return NextResponse.json(res);
  } catch (e) {
    captureException(e);
    return NextResponse.json(
      { message: "Failed to fetch team members" },
      { status: 500 },
    );
  }
}
