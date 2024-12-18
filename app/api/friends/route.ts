import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    console.log("Received User ID:", userId);

    if (!userId) {
      console.log("No user ID provided");
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Verify if the user exists
    const userExists = await prisma.user.findUnique({
      where: { spotify_uri: `spotify:user:${userId}` },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Fetch friendships
    const friends = await prisma.friendship.findMany({
      where: {
        OR: [{ userId: userId }, { friendId: userId }],
      },
      include: {
        user: true,
        friend: true,
      },
    });

    const friendList = friends.map((friendship) =>
      friendship.userId === userId
        ? {
            id: friendship.friend.id,
            userId: friendship.friend.userId,
            displayName: friendship.friend.displayName,
            spotify_access_token: friendship.friend.spotify_access_token,
            spotify_refresh_token: friendship.friend.spotify_refresh_token
          }
        : {
            id: friendship.user.id,
            userId: friendship.user.userId,
            displayName: friendship.user.displayName,
            spotify_access_token: friendship.user.spotify_access_token,
            spotify_refresh_token: friendship.user.spotify_refresh_token
          }
    );

    console.log("Processed Friend List with Tokens:", friendList);

    return NextResponse.json(friendList);
  } catch (error) {
    console.error("Error fetching friends:", error);
    return NextResponse.json(
      { error: "Failed to fetch friends" },
      { status: 500 }
    );
  }
}


// In /app/api/friends/route.ts
export async function POST(request: NextRequest) {
  try {
    const { friendId } = await request.json();
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value as string;

    console.log("Attempting to create friendship:", { userId, friendId });

    // Verify both users exist
    const [user, friend] = await Promise.all([
      prisma.user.findUnique({ where: { userId: userId } }),
      prisma.user.findUnique({ where: { userId: friendId } }),
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
