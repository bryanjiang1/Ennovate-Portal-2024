import { connectToDatabase } from "@/lib/mongoose";
import { redis } from "@/lib/redis";
import Project from "@/models/Project";
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
      Project.findByIdAndDelete(id),
      redis?.del(["project"]),
    ]);

    captureMessage(`Deleted project with id ${id}`, "info");

    return NextResponse.json("Success");
  } catch (e) {
    captureException(e);
    return NextResponse.json(
      { message: "Failed to delete project" },
      { status: 500 },
    );
  }
}
