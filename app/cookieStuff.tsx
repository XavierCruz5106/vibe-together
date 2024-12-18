'use server'
import { cookies } from "next/headers";

export async function getUserId(): Promise<string> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value ?? ""; // Provide an empty string if undefined
  return userId;
}

export async function getSpotifyAccessToken(): Promise<string> {
  const cookieStore = await cookies();
  const spotifyAccessToken = cookieStore.get("spotify_access_token")?.value ?? ""; // Provide an empty string if undefined
  return spotifyAccessToken;
}

export async function getSpotifyRefreshToken(): Promise<string> {
  const cookieStore = await cookies();
  const spotifyRefreshToken = cookieStore.get("spotify_refresh_token")?.value ?? ""; // Provide an empty string if undefined
  return spotifyRefreshToken;
}
