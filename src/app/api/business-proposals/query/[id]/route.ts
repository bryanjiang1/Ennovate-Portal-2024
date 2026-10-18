import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import BusinessProposal from "@/models/BusinessProposal";
import { redis } from "@/lib/redis";
import { CACHE_KEY_EXPIRY_TIME } from "@/constants/actions";
import { captureException } from "@sentry/nextjs";

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const { id } = params;
    const cacheKey = `businessProposal:${id}`;
    const cachedValue = await redis?.get(cacheKey);

    if (cachedValue) {
      return NextResponse.json(JSON.parse(cachedValue));
    }

    const businessProposal = await BusinessProposal.findById(id);

    if (!businessProposal) {
      return NextResponse.json(
        { message: "Business Report not found" },
        { status: 404 }
      );
    }

    await redis
      ?.pipeline()
      .set(cacheKey, JSON.stringify(businessProposal))
      .expire(cacheKey, CACHE_KEY_EXPIRY_TIME)
      .exec();

    return NextResponse.json(businessProposal);
  } catch (e) {
    captureException(e);
    return NextResponse.json(
      { message: "Failed to fetch business report" },
      { status: 500 }
    );
  }
}
