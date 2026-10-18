import { connectToDatabase } from "@/lib/mongoose";
import { redis } from "@/lib/redis";
import BusinessWorkshop from "@/models/BusinessWorkshop";
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
      BusinessWorkshop.findByIdAndDelete(id),
      redis?.del([`businessWorkshop:${id}`, "businessWorkshop"]),
    ]);

    captureMessage(`Deleted business workshop with id ${id}`, "info");

    return NextResponse.json("Success");
  } catch (e) {
    captureException(e);
    return NextResponse.json(
      { message: "Failed to delete business workshop" },
      { status: 500 },
    );
  }
}
