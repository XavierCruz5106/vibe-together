const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const client_secret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;
const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/callback`;

export function getSpotifyAuthURL() {
  console.log(clientId);
  console.log(client_secret);

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
        Buffer.from(redirectUri + ":" + client_secret).toString("base64"),
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

  return response.json();
}

export async function getUserProfile(access_token: string) {
  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  return response.json();
}
