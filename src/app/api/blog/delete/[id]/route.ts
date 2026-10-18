import { connectToDatabase } from "@/lib/mongoose";
import { redis } from "@/lib/redis";
import Blog from "@/models/Blog";
import { captureException, captureMessage } from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const { id } = params;

    await Promise.all([
      Blog.findByIdAndDelete(id),
      redis?.del(["blog", "blog?featured"]),
    ]);

    captureMessage(`Deleted blog with id ${id}`, 'info');

    return NextResponse.json("Success");
  } catch (e) {
    captureException(e);
    return NextResponse.json(
      { message: "Failed to delete blog" },
      { status: 500 }
    );
  }
}
