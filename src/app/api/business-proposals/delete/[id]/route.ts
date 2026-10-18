import { connectToDatabase } from "@/lib/mongoose";
import { redis } from "@/lib/redis";
import BusinessProposal from "@/models/BusinessProposal";
import { captureException, captureMessage } from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectToDatabase();

    const { id } = params;

    await Promise.all([
      BusinessProposal.findByIdAndDelete(id),
      redis?.del([`businessProposal:${id}`, "businessProposal"]),
    ]);

    captureMessage(`Deleted business report ${id}`, 'info');

    return NextResponse.json("Success");
  } catch (e) {
    captureException(e);
    return NextResponse.json(
      { message: "Failed to delete business report" },
      { status: 500 },
    );
  }
}
