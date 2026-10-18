import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import TeamMember from "@/models/TeamMember";
import { teamMemberError } from "@/lib/teamMemberError";
import { captureException } from "@sentry/nextjs";

// Editors must always load the latest saved member, including repeat visits.
export const dynamic = "force-dynamic";

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectToDatabase();

    const { id } = params;

    const teamMember = await TeamMember.findById(id);

    if (!teamMember) {
      return NextResponse.json(
        { message: "Team Member not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(teamMember);
  } catch (e) {
    captureException(e);
    return teamMemberError(e, "Failed to fetch team member");
  }
}
