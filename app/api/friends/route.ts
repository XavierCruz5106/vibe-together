import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Retrieve the userId from the query parameters
    const userId = request.nextUrl.searchParams.get("userId");

    console.log("Received User ID:", userId); // Detailed logging

    if (!userId) {
      console.log("No user ID provided");
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }


    console.log("Searching for friendships for user ID:", userId);

    // First, verify if the user exists
    const userExists = await prisma.user.findUnique({
      where: { spotify_uri: `spotify:user:${userId}` },
    });

    if (!userExists) {
      console.log("User does not exist in the database");
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Check for existing friendships
    const friends = await prisma.friendship.findMany({
      where: {
        OR: [{ userId: userId }, { friendId: userId }],
      },
      include: {
        user: true,
        friend: true,
      },
    });

    console.log("Found Friendships:", friends);

    // If no friendships exist, return an empty array
    if (friends.length === 0) {
      console.log("No friendships found for this user");
      return NextResponse.json([], { status: 200 });
    }

    const friendList = friends.map((friendship) =>
      friendship.userId === userId ? friendship.friend : friendship.user
    );

    console.log("Processed Friend List:", friendList);

    // Ensure you're returning a clean object
    return NextResponse.json(friendList);
  } catch (error) {
    console.error("Detailed Catch Block Error:", error);

    // Ensure error handling is correct
    return NextResponse.json(
      {
        error: "Failed to fetch friends",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}

// In /app/api/friends/route.ts
export async function POST(request: NextRequest) {
  try {
    const { userId, friendId } = await request.json();

    console.log("Attempting to create friendship:", { userId, friendId });

    // Verify both users exist
    const [user, friend] = await Promise.all([
      prisma.user.findUnique({ where: { id: Number(userId) } }),
      prisma.user.findUnique({ where: { id: Number(friendId) } }),
    ]);

    if (!user || !friend) {
      return NextResponse.json(
        { error: "One or both users not found" },
        { status: 404 }
      );
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: userId, friendId: friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    if (existingFriendship) {
      return NextResponse.json(
        { message: "Friendship already exists" },
        { status: 200 }
      );
    }

    // Create new friendship
    const newFriendship = await prisma.friendship.create({
      data: {
        userId: userId,
        friendId: friendId,
      },
    });

    console.log("Created Friendship:", newFriendship);

    return NextResponse.json(newFriendship, { status: 201 });
  } catch (error) {
    console.error("Error creating friendship:", error);
    return NextResponse.json(
      { error: "Failed to create friendship" },
      { status: 500 }
    );
  }
}
