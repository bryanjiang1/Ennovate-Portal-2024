import { connectToDatabase } from "@/lib/mongoose";
import { teamMemberError } from "@/lib/teamMemberError";
import { savedTeamMemberSchema } from "@/validation/teamMember";
import TeamMember from "@/models/TeamMember";
import { captureException, captureMessage } from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { name, email, image, title } = savedTeamMemberSchema.parse(
      await request.json(),
    );

    await TeamMember.create({ name, email, image, title });

    captureMessage(`Created team member ${name}`, "info");

    return NextResponse.json("Success");
  } catch (e) {
    captureException(e);
    return teamMemberError(e, "Failed to create team member");
  }
}
