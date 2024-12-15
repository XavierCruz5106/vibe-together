import prisma from "@/lib/db";
import { NextResponse } from "next/server";

// In a separate route file, perhaps /api/users/route.ts
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        spotify_uri: true,
        // Add other fields you want to see
      },
    });

    return NextResponse.json({
      count: users.length,
      users: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
