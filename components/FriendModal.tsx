'use client';

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { refreshFriendSpotifyToken } from "@/lib/spotify";

interface FriendModalProps {
  friend: {
    userId: string;
    displayName: string;
    spotify_access_token: string;
    spotify_refresh_token: string;
  };
}

const FriendModal: React.FC<FriendModalProps> = ({ friend }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<any>(null);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  // Polling function to fetch the currently playing track
  const fetchCurrentlyPlaying = async (accessToken: string) => {
    try {
      let response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // If the response status is 401 (Unauthorized), refresh the token
      if (response.status === 401) {
        console.log("Access token expired. Refreshing...");

        // Refresh the access token
        const newAccessToken = await refreshFriendSpotifyToken(friend.spotify_refresh_token, friend.userId);

        // Retry fetching currently playing with the new token
        response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
          headers: {
            Authorization: `Bearer ${newAccessToken}`,
          },
        });
      }

      // Handle the response for different status codes
      if (response.status === 204) {
        // No track is currently playing
        setCurrentlyPlaying(null);
      } else if (response.ok) {
        // Successfully fetched currently playing track
        const data = await response.json();
        setCurrentlyPlaying({
          item: data.item,
        });
      }
    } catch (error) {
      console.error("Error fetching currently playing track:", error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchCurrentlyPlaying(friend.spotify_access_token);

    // Set interval for polling every 5 seconds
    const interval = setInterval(() => {
      fetchCurrentlyPlaying(friend.spotify_access_token);
    }, 15000);

    // Cleanup the interval on unmount
    return () => {
      clearInterval(interval);
    };
  }, [friend.spotify_access_token]);

  return (
    <>
      {/* Entire container is now clickable and hoverable */}
      <div
        className="flex justify-between items-center w-full cursor-pointer
                   hover:bg-gray-100 transition-colors duration-200 ease-in-out
                   rounded-md p-2 group"
        onClick={openModal}
      >
        <div className="">
          {friend.displayName}
        </div>
        <span>
          {currentlyPlaying?.item
            ? `${currentlyPlaying.item.name} by ${currentlyPlaying.item.artists[0].name}`
            : "Not listening to anything"}
        </span>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            // Close modal if clicking outside the modal content
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="bg-white rounded-lg p-6 w-96"
            // Prevent closing when clicking inside the modal
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">
              {friend.displayName}'s Currently Playing
            </h3>

            {currentlyPlaying?.item ? (
              <div className="flex flex-col items-center">
                <img
                  src={currentlyPlaying.item.album.images[0].url}
                  alt="Album Cover"
                  className="w-32 h-32 rounded-lg mb-4"
                />
                <p className="text-lg font-medium">
                  {currentlyPlaying.item.name}
                </p>
                <p className="text-gray-600">
                  {currentlyPlaying.item.artists[0].name}
                </p>
                <p className="text-sm text-gray-400">Playing on Spotify</p>
              </div>
            ) : (
              <p className="text-gray-600">Not playing anything currently.</p>
            )}

            <div className="mt-6 flex justify-end">
              <Button
                onClick={closeModal}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FriendModal;