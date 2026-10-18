import { connectToDatabase } from "@/lib/mongoose";
import { redis } from "@/lib/redis";
import BusinessWorkshop from "@/models/BusinessWorkshop";
import { captureException, captureMessage } from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectToDatabase();

    const { id } = params;

    const body = await request.json();

    await Promise.all([
      BusinessWorkshop.findByIdAndUpdate(id, body),
      redis?.del([`businessWorkshop:${id}`, "businessWorkshop"]),
    ]);

    captureMessage(`Updated business workshop with id ${id}`, "info");

    return NextResponse.json("Success");
  } catch (e) {
    captureException(e);
    return NextResponse.json(
      { message: "Failed to update business workshop" },
      { status: 500 },
    );
  }
}
