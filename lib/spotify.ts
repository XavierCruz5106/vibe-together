import axios from "axios";
import { getUserId } from "../app/cookieStuff";

const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const clientSecret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;
const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/callback`;

// // Fetch the list of connected friends for the user
// async function fetchFriends(accessToken: string) {
//   const cookieStore = await cookies();
//   const userId = cookieStore.get("user_id")?.value;

//   if (!userId) {
//     throw new Error("User ID is missing");
//   }

//   try {
//     const response = await fetch(
//       `${process.env.NEXT_PUBLIC_BASE_URL}/api/friends?userId=${userId}`,
//       {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//         // Remove credentials: "include" as it's not needed for same-origin requests
//       }
//     );

//     // Check if the response is ok
//     if (!response.ok) {
//       const errorBody = await response.text();
//       console.error("Error response:", errorBody);
//       throw new Error(
//         `HTTP error! status: ${response.status}, body: ${errorBody}`
//       );
//     }

//     const friends = await response.json();
//     console.log("Fetched Friends:", friends);

//     return Array.isArray(friends) ? friends : [];
//   } catch (error) {
//     console.error("Error fetching friends:", error);
//     return []; // Return empty array on error
//   }
// }


// Function to refresh a friend's Spotify access token
export async function refreshSpotifyToken(refreshToken: string) {

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

      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/users`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: await getUserId(),
          spotify_access_token: access_token, // Pass the old token to the API to refresh it
        }),
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


export async function refreshFriendSpotifyToken(refreshToken: string, userId: string) {

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

      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/users`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          spotify_access_token: access_token, // Pass the old token to the API to refresh it
        }),
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


async function fetchCurrentlyPlayingForFriend(friendAccessToken: string, friendRefreshToken: string, userId: string) {
  try {
    const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: {
        Authorization: `Bearer ${friendAccessToken}`,
      },
    });

    if (response.status === 401) {
      console.log("Access token expired. Refreshing... ??");
      const newAccessToken = await refreshSpotifyToken(friendRefreshToken);
      return await fetchCurrentlyPlayingForFriend(newAccessToken, friendRefreshToken, userId);
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


export async function fetchFriendsWithTracks() {
  const userId = getUserId()

  if (!userId) throw new Error("User ID is missing");

  try {
    // Fetch friends list
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/friends?userId=${await userId}`
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


export function getSpotifyAuthURL() {
  console.log(clientId);
  console.log(clientSecret);

  if (!clientId) {
    throw new Error("Spotify client ID is missing.");
  }
  const scopes = [
    "user-read-currently-playing",
    "user-read-private",
    "user-read-email",
  ];
  return (
    "https://accounts.spotify.com/authorize?" +
    new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      scope: scopes.join(" "),
      redirect_uri: redirectUri,
    })
  );
}

export async function getAccessToken(code: string) {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(clientId + ":" + clientSecret).toString("base64"), // Correct this part
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Spotify API error:", errorData);
    throw new Error(
      `Spotify API error: ${errorData.error_description || errorData.error}`
    );
  }

  return response.json();
}

export async function getCurrentlyPlaying(access_token: string) {
  const response = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  if (response.status === 204) {
    return null;
  }

  if (response.status === 400){
    console.log(access_token)
    return null;
  }

  return response.json();
}

export async function getUserProfile(access_token: string) {
  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
  console.log(response)

  return response.json();
}
