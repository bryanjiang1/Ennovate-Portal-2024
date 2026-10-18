import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function teamMemberError(error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { message: error.issues[0].message },
      { status: 400 },
    );
  }
  if (typeof error === "object" && error !== null) {
    if ("code" in error && error.code === 11000) {
      return NextResponse.json(
        { message: "A team member with this email already exists." },
        { status: 409 },
      );
    }
    if ("name" in error && error.name === "CastError") {
      return NextResponse.json(
        { message: "Invalid team member ID." },
        { status: 400 },
      );
    }
  }
  return NextResponse.json({ message: fallback }, { status: 500 });
}
