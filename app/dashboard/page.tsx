import { cookies } from "next/headers";
import { getCurrentlyPlaying } from "@/lib/spotify";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import ClientComponent from "./client-dashboard";

async function fetchCurrentlyPlaying(accessToken: string) {
  const currentlyPlaying = await getCurrentlyPlaying(accessToken);
  return currentlyPlaying;
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

export default async function Dashboard() {
  const cookieStore = cookies();
  const accessToken = (await cookieStore).get("spotify_access_token")?.value;

  if (!accessToken) {
    redirect("/login");
  }

  // Fetch the currently playing track and friends data
  const currentlyPlaying = await fetchCurrentlyPlaying(accessToken);
  const friends = await fetchFriends(accessToken);

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
        {friends.length === 0 ? (
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
          <div>
            <ul className="space-y-2">
              {friends.map((friend: { id: string; name: string }) => (
                <li
                  key={friend.id}
                  className="flex justify-between items-center"
                >
                  <span>{friend.name}</span>
                  {/* You could also display the friend's current track here */}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
