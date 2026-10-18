import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { redis } from "@/lib/redis";
import { CACHE_KEY_EXPIRY_TIME } from "@/constants/actions";
import BusinessWorkshop from "@/models/BusinessWorkshop";
import { captureException } from "@sentry/nextjs";

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const { id } = params;
    const cacheKey = `businessWorkshop:${id}`;
    const cachedValue = await redis?.get(cacheKey);

    if (cachedValue) {
      return NextResponse.json(JSON.parse(cachedValue));
    }

    const businessWorkshop = await BusinessWorkshop.findById(id);

    if (!businessWorkshop) {
      return NextResponse.json(
        { message: "Business Workshop not found" },
        { status: 404 }
      );
    }

    await redis
      ?.pipeline()
      .set(cacheKey, JSON.stringify(businessWorkshop))
      .expire(cacheKey, CACHE_KEY_EXPIRY_TIME)
      .exec();

    return NextResponse.json(businessWorkshop);
  } catch (e) {
    captureException(e);
    return NextResponse.json(
      { message: "Failed to fetch business workshop" },
      { status: 500 }
    );
  }
}
