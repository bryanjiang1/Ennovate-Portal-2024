import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { redis } from "@/lib/redis";
import { CACHE_KEY_EXPIRY_TIME } from "@/constants/actions";
import { captureException } from "@sentry/nextjs";
import Project from "@/models/Project";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const cacheKey = "project";
    const cachedValue = await redis?.get(cacheKey);

    if (cachedValue) {
      return NextResponse.json(JSON.parse(cachedValue));
    }

    const projects = await Project.find({}).populate("businessProposal").populate("blog");

    await redis
      ?.pipeline()
      .set(cacheKey, JSON.stringify(projects))
      .expire(cacheKey, CACHE_KEY_EXPIRY_TIME)
      .exec();

    return NextResponse.json(projects);
  } catch (e) {
    captureException(e);
    return NextResponse.json(
      { message: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}