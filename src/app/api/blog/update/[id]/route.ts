import { connectToDatabase } from "@/lib/mongoose";
import { redis } from "@/lib/redis";
import Blog from "@/models/Blog";
import { captureException, captureMessage } from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const { id } = params;

    const body = await request.json();

    await Promise.all([
      Blog.findByIdAndUpdate(id, body),
      redis?.del(["blog", "blog?featured"]),
    ]);

    captureMessage(`Updated blog with id ${id}`, 'info');

    return NextResponse.json("Success");
  } catch (e) {
    captureException(e);
    return NextResponse.json(
      { message: "Failed to update blog" },
      { status: 500 }
    );
  }
}
