import { connectToDatabase } from "@/lib/mongoose";
import { teamMemberError } from "@/lib/teamMemberError";
import TeamMember from "@/models/TeamMember";
import { captureException, captureMessage } from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectToDatabase();

    const { id } = params;

    const member = await TeamMember.findByIdAndDelete(id);
    if (!member) {
      return NextResponse.json(
        { message: "Team member not found" },
        { status: 404 },
      );
    }

    captureMessage(`Deleted team member ${id}`, "info");

    return NextResponse.json("Success");
  } catch (e) {
    captureException(e);
    return teamMemberError(e, "Failed to delete team member");
  }
}
