import { connectToDatabase } from "@/lib/mongoose";
import { redis } from "@/lib/redis";
import Blog from "@/models/Blog";
import { captureException, captureMessage } from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { mediumUrl, featured } = await request.json();

    await Blog.create({ mediumUrl, featured });

    await redis?.del(["blog", "blog?featured"]);

    captureMessage(`Created blog with URL ${mediumUrl}`, 'info');

    return NextResponse.json("Success");
  } catch (e) {
    captureException(e);

    return NextResponse.json(
      { message: "Failed to create business report" },
      { status: 500 }
    );
  }
}
