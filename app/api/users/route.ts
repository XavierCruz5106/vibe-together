import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PATCH(req: Request) {
  const {spotify_access_token, userId} = await req.json();

  // Build the update object only with provided fields
  const updateData: Record<string, unknown> = {};

  if (spotify_access_token) {
    updateData.spotify_access_token = spotify_access_token;
  }

  // You can add more fields here as needed

  try {
    // Update user data in the database
    const updatedUser = await prisma.user.update({
      where: { userId: userId },
      data: updateData,
    });

    // Return the updated user
    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
