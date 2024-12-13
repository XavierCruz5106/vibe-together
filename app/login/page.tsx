"use client";

import { Button } from "@/components/ui/button";
import { getSpotifyAuthURL } from "@/lib/spotify";
import { ErrorMessage } from "@/components/error-message";
import { useState, useEffect } from "react";

interface LoginProps {
  searchParams: Promise<{ error?: string }>; // Explicitly wrap in a Promise
}

export default function Login({ searchParams }: LoginProps) {
  const spotifyAuthURL = getSpotifyAuthURL();

  // Await the searchParams promise to extract error value
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Resolve searchParams to get the error value
    searchParams.then((params) => {
      setError(params.error);
    });
  }, [searchParams]);

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "authentication_failed":
        return "Authentication failed. Please try again.";
      case "no_code":
        return "No authorization code received from Spotify.";
      default:
        return `An error occurred: ${error}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-400 to-blue-500 flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-4xl font-bold mb-8">Login to Vibe</h1>
      {error && (
        <ErrorMessage message={getErrorMessage(decodeURIComponent(error))} />
      )}
      <Button asChild className="mt-4">
        <a
          href={spotifyAuthURL}
          className="bg-[#1DB954] text-white px-6 py-3 rounded-full text-xl font-semibold hover:bg-opacity-90 transition duration-300"
        >
          Login with Spotify
        </a>
      </Button>
    </div>
  );
}
