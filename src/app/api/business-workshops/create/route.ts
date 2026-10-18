import { connectToDatabase } from "@/lib/mongoose";
import { redis } from "@/lib/redis";
import BusinessWorkshop from "@/models/BusinessWorkshop";
import { captureException, captureMessage } from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { name, month, slides, worksheet } = await request.json();

    await BusinessWorkshop.create({ name, month, slides, worksheet });

    await redis?.del(["businessWorkshop"]);

    captureMessage(`Created business workshop ${name}`, "info");

    return NextResponse.json("Success");
  } catch (e) {
    captureException(e);
    return NextResponse.json(
      { message: "Failed to create business report" },
      { status: 500 }
    );
  }
}
