import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import BusinessProposal from "@/models/BusinessProposal";
import { redis } from "@/lib/redis";
import { CACHE_KEY_EXPIRY_TIME } from "@/constants/actions";
import { captureException } from "@sentry/nextjs";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const cacheKey = "businessProposal";
    const cachedValue = await redis?.get(cacheKey);

    if (cachedValue) {
      return NextResponse.json(JSON.parse(cachedValue));
    }

    const businessProposals = await BusinessProposal.find({});

    await redis
      ?.pipeline()
      .set(cacheKey, JSON.stringify(businessProposals))
      .expire(cacheKey, CACHE_KEY_EXPIRY_TIME)
      .exec();

    return NextResponse.json(businessProposals);
  } catch (e) {
    captureException(e);
    return NextResponse.json(
      { message: "Failed to fetch business reports" },
      { status: 500 }
    );
  }
}
