import { cookies } from "next/headers";
import { getCurrentlyPlaying } from "@/lib/spotify";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import ClientComponent from "./client-dashboard";
import prisma from "@/lib/db";
import axios from "axios";

const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const clientSecret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;




async function fetchCurrentlyPlaying(accessToken: string) {
  const currentlyPlaying = await getCurrentlyPlaying(accessToken);
  return currentlyPlaying;
}

// Function to refresh a friend's Spotify access token
export async function refreshSpotifyToken(friendRefreshToken: string, userId: string) {
  const refreshToken = friendRefreshToken;

  const tokenUrl = "https://accounts.spotify.com/api/token";

  try {
    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${clientId}:${clientSecret}`
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response.status === 200) {
      const { access_token, expires_in } = response.data;

      // Save the new access token to the database
      await prisma.user.update({
        where: { userId: userId },
        data: { spotify_access_token: access_token },
      });

      console.log("Successfully refreshed token for friend!");
      return access_token;
    } else {
      console.error("Failed to refresh token:", response.data);
      throw new Error("Token refresh failed");
    }
  } catch (error) {
    console.error("Error refreshing Spotify token:", error);
    throw error;
  }
}

// Fetch the list of connected friends for the user
async function fetchFriends(accessToken: string) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  if (!userId) {
    throw new Error("User ID is missing");
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/friends?userId=${userId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        // Remove credentials: "include" as it's not needed for same-origin requests
      }
    );

    // Check if the response is ok
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Error response:", errorBody);
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorBody}`
      );
    }

    const friends = await response.json();
    console.log("Fetched Friends:", friends);

    return Array.isArray(friends) ? friends : [];
  } catch (error) {
    console.error("Error fetching friends:", error);
    return []; // Return empty array on error
  }
}


async function fetchCurrentlyPlayingForFriend(friendAccessToken: string, friendRefreshToken: string, friendId: string) {
  try {
    const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: {
        Authorization: `Bearer ${friendAccessToken}`,
      },
    });

    if (response.status === 401) {
      console.log("Access token expired. Refreshing...");
      const newAccessToken = await refreshSpotifyToken(friendRefreshToken, friendId);
      return await fetchCurrentlyPlayingForFriend(newAccessToken, friendRefreshToken, friendId);
    }

    if (response.ok && response.status != 204) {
      const currentlyPlaying = await response.json();
      return currentlyPlaying;
    }

    if (response.status === 204) {
      return {};
    }

    throw new Error("Failed to fetch currently playing track");
  } catch (error) {
    console.error("Error fetching currently playing track for friend:", error);
    return null;
  }
}


async function fetchFriendsWithTracks() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  if (!userId) throw new Error("User ID is missing");

  try {
    // Fetch friends list
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/friends?userId=${userId}`
    );

    if (!response.ok) throw new Error("Failed to fetch friends");

    const friends = await response.json();

    // Fetch currently playing track for each friend
    const friendsWithTracks = await Promise.all(
      friends.map(async (friend: { userId: string; spotify_access_token: string; spotify_refresh_token: string }) => {
        const currentlyPlaying = await fetchCurrentlyPlayingForFriend(friend.spotify_access_token, friend.spotify_refresh_token, friend.userId);
        return {
          ...friend,
          currentlyPlaying,
        };
      })
    );

    return friendsWithTracks;
  } catch (error) {
    console.error("Error fetching friends and their tracks:", error);
    return [];
  }
}



export default async function Dashboard() {
  const cookieStore = cookies();
  const accessToken = (await cookieStore).get("spotify_access_token")?.value;

  if (!accessToken) {
    redirect("/login");
  }

  // Fetch the currently playing track and friends data
  const currentlyPlaying = await fetchCurrentlyPlaying(accessToken);
  const friendsWithTracks = await fetchFriendsWithTracks();
  console.log("Friends with tracks")
  console.log(friendsWithTracks)

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-400 to-blue-500 p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Your Vibe</h1>
      <ClientComponent
        currentlyPlaying={currentlyPlaying}
        accessToken={accessToken}
      />

      <div className="bg-white rounded-lg p-6 mt-8">
        <h2 className="text-2xl font-semibold mb-4">Connected Friends</h2>

        {/* If no friends are connected */}
        {friendsWithTracks.length === 0 ? (
          <div>
            <p className="text-lg mb-4">
              You haven&apos;t connected with any friends yet.
            </p>
            <Button asChild>
              <Link
                href="/connect"
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Connect with Friends
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Friends' Tracks</h2>
            <ul className="space-y-2">
              {friendsWithTracks.map((friend) => (
                <li key={friend.userId} className="flex justify-between items-center">
                  <span>{friend.userId}</span>
                  <span>
                    {friend.currentlyPlaying?.item
                      ? `${friend.currentlyPlaying.item.name} by ${friend.currentlyPlaying.item.artists[0].name}`
                      : "Not listening to anything"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
