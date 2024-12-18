'use client'
import { fetchFriendsWithTracks, getCurrentlyPlaying, refreshSpotifyToken } from "@/lib/spotify";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ClientComponent from "./client-dashboard";
import FriendModal from "@/components/FriendModal";
import { getSpotifyAccessToken, getSpotifyRefreshToken, getUserId } from "../cookieStuff";
import { useEffect, useState } from "react";

// Async function to fetch the currently playing track
async function fetchCurrentlyPlaying(accessToken: string) {
  const currentlyPlaying = await getCurrentlyPlaying(accessToken);
  return currentlyPlaying;
}

export default function Dashboard() {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<any>(null);
  const [friendsWithTracks, setFriendsWithTracks] = useState<any[]>([]);
  const [spotifyStuffs, setSpotifyStuffs] = useState({
    accessToken: "",
    userId: "",
    refreshToken: "",
  });

  // Function to fetch data and update state
  const populateData = async () => {
    try {
      const accessToken = await getSpotifyAccessToken();
      const userId = await getUserId();
      const refreshToken = await getSpotifyRefreshToken();

      setSpotifyStuffs({
        accessToken: accessToken || "",
        userId: userId || "",
        refreshToken: refreshToken || "",
      });
    } catch (error) {
      console.error("Error populating Spotify data:", error);
    }
  };

  // Use effect to set up polling for currently playing track and friends' tracks
  useEffect(() => {
    const fetchAndUpdateCurrentlyPlaying = async () => {
      try {
        let data = await fetchCurrentlyPlaying(spotifyStuffs.accessToken);
        setCurrentlyPlaying(data);
      } catch (error) {
        console.error("Error fetching currently playing track:", error);
      }
    };

    const fetchAndUpdateFriendsData = async () => {
      try {
        const friendsWithTracksData = await fetchFriendsWithTracks();
        setFriendsWithTracks(friendsWithTracksData);
      } catch (error) {
        console.error("Error fetching friends data:", error);
      }
    };

    // Polling intervals
    const currentlyPlayingIntervalId = setInterval(() => {
      fetchAndUpdateCurrentlyPlaying();
    }, 15000);

    const friendsIntervalId = setInterval(() => {
      fetchAndUpdateFriendsData();
    }, 15000); // Polling friends every 15 seconds to reduce unnecessary API calls

    populateData();
    // Fetch initial data for friends and currently playing track
    fetchAndUpdateCurrentlyPlaying();
    fetchAndUpdateFriendsData();

    // Cleanup intervals on unmount
    return () => {
      clearInterval(currentlyPlayingIntervalId);
      clearInterval(friendsIntervalId);
    };
  }, []);

  // Handle the scenario when the track is 401 (token expired) and refresh it
  const handleTokenRefresh = async () => {
    try {
      const newAccessToken = await refreshSpotifyToken(spotifyStuffs.refreshToken);
      setCurrentlyPlaying(await fetchCurrentlyPlaying(newAccessToken));
    } catch (error) {
      console.error("Error refreshing token:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-400 to-blue-500 p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Your Vibe</h1>
      <ClientComponent
        currentlyPlaying={currentlyPlaying}
        accessToken={spotifyStuffs.accessToken}
        userId={spotifyStuffs.userId}
        refreshToken={spotifyStuffs.refreshToken}
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
            <ul className="space-y-2">
              {friendsWithTracks.map((friend) => (
                <li key={friend.userId} className="flex justify-between items-center">
                  {/* Passing friend data to the FriendModal component */}
                  <FriendModal friend={friend} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}