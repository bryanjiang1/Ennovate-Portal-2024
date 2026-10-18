import { connectToDatabase } from "@/lib/mongoose";
import { teamMemberError } from "@/lib/teamMemberError";
import { savedTeamMemberSchema } from "@/validation/teamMember";
import TeamMember from "@/models/TeamMember";
import { captureException, captureMessage } from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectToDatabase();

    const { id } = params;

    const body = savedTeamMemberSchema.parse(await request.json());

    const member = await TeamMember.findByIdAndUpdate(id, body, {
      runValidators: true,
    });
    if (!member) {
      return NextResponse.json(
        { message: "Team member not found" },
        { status: 404 },
      );
    }

    captureMessage(`Updated team member ${id}`, "info");

    return NextResponse.json("Success");
  } catch (e) {
    captureException(e);
    return teamMemberError(e, "Failed to update team member");
  }
}
