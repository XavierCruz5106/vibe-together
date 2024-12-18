"use client";

import { useEffect, useState } from "react";
import { getCurrentlyPlaying, refreshSpotifyToken } from "@/lib/spotify";
import Image from "next/image";
import prisma from "@/lib/db";
import { getSpotifyRefreshToken } from "../cookieStuff";

interface ClientComponentProps {
  // WILL FIX THIS LATER!!!!
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentlyPlaying: any;
  accessToken: string;
  userId: string;
  refreshToken: string;
}

export default function ClientComponent({
  currentlyPlaying,
  accessToken,
  userId,
  refreshToken,
}: ClientComponentProps) {
  const [currentTrack, setCurrentTrack] = useState(currentlyPlaying);

  useEffect(() => {
    const fetchCurrentlyPlaying = async () => {

      let data = await getCurrentlyPlaying(accessToken);
      if (data === null){
        console.log("nothing playing")
      }

      if (data.error && data.error.status === 401) {
        console.log("Token Expired... Refreshing");
        const newAccessToken = await refreshSpotifyToken(refreshToken);
        accessToken = newAccessToken;
        data = await getCurrentlyPlaying(newAccessToken); // Use the refreshed token
      }
      setCurrentTrack(data);
    };

    const intervalId = setInterval(fetchCurrentlyPlaying, 15000);

    return () => clearInterval(intervalId); // Clean up interval on unmoun
  }, [accessToken, userId, refreshToken]); // Adding userId as dependency

  return (
    <div>
      {currentTrack && currentTrack.item ? (
        <div className="bg-white rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-center">
            Currently Playing
          </h2>
          <Image
            className="mx-auto mb-4 rounded-lg shadow-md"
            src={currentTrack.item.album.images[0].url}
            width={currentTrack.item.album.images[0].width / 2}
            height={currentTrack.item.album.images[0].height / 2}
            alt="cover"
          />
          <p className="text-xl text-center">
            {currentTrack.item.name} by {currentTrack.item.artists[0].name}
          </p>
          <p className="text-xl text-center">{currentTrack.item.album.name}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-6 mb-8">
          <p className="text-xl">Not currently playing any track</p>
        </div>
      )}
    </div>
  );
}
