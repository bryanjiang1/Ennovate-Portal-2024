import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { redis } from "@/lib/redis";
import { CACHE_KEY_EXPIRY_TIME } from "@/constants/actions";
import BusinessWorkshop from "@/models/BusinessWorkshop";
import { captureException } from "@sentry/nextjs";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const cacheKey = "businessWorkshop";
    const cachedValue = await redis?.get(cacheKey);

    if (cachedValue) {
      return NextResponse.json(JSON.parse(cachedValue));
    }

    const businessWorkshops = await BusinessWorkshop.find({});

    await redis
      ?.pipeline()
      .set(cacheKey, JSON.stringify(businessWorkshops))
      .expire(cacheKey, CACHE_KEY_EXPIRY_TIME)
      .exec();

    return NextResponse.json(businessWorkshops);
  } catch (e) {
    captureException(e);
    return NextResponse.json(
      { message: "Failed to fetch business workshops" },
      { status: 500 }
    );
  }
}
