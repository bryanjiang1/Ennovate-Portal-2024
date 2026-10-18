import { connectToDatabase } from "@/lib/mongoose";
import { redis } from "@/lib/redis";
import Project from "@/models/Project";
import { captureException, captureMessage } from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { name, description, presentationSlides, businessProposal, blog } = await request.json();

    await Project.create({ name, description, presentationSlides, businessProposal, blog });

    await redis?.del(["project"]);

    captureMessage(`Created project ${name}`, 'info');

    return NextResponse.json("Success");
  } catch (e) {
    captureException(e);
    return NextResponse.json(
      { message: "Failed to create project" },
      { status: 500 }
    );
  }
}
