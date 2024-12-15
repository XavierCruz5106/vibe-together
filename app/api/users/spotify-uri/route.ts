import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  const spotifyUri = request.nextUrl.searchParams.get("uri");

  if (!spotifyUri) {
    return NextResponse.json(
      { error: "Spotify URI is required" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { spotify_uri: spotifyUri },
      select: {
        id: true,
        spotify_uri: true,
        // Add other fields you want to see
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
