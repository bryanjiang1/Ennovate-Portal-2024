import { connectToDatabase } from "@/lib/mongoose";
import { redis } from "@/lib/redis";
import BusinessProposal from "@/models/BusinessProposal";
import { captureException, captureMessage } from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { name, description, drive, image } = await request.json();

    await BusinessProposal.create({ name, description, drive, image });

    await redis?.del(["businessProposal"]);

    captureMessage(`Created business report ${name}`, 'info');

    return NextResponse.json("Success");
  } catch (e) {
    captureException(e);
    return NextResponse.json(
      { message: "Failed to create business report" },
      { status: 500 }
    );
  }
}
