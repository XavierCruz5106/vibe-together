import { NextRequest, NextResponse } from "next/server";
import { getAccessToken, getUserProfile } from "@/lib/spotify";
import prisma from "@/lib/db"; // Make sure you have this import

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url));
  }

  try {
    const tokenResponse = await getAccessToken(code);

    console.log(tokenResponse);

    if ("error" in tokenResponse) {
      throw new Error(tokenResponse.error_description || tokenResponse.error);
    }

    const { access_token, refresh_token } = tokenResponse;
    const user = await getUserProfile(access_token);

    console.log("Spotify User Profile:", user);

    // Upsert user in database
    const upsertedUser = await prisma.user.upsert({
      where: { spotify_uri: `spotify:user:${user.id}` },
      update: {
        // Add any other fields you want to update
        spotify_access_token: access_token,
        spotify_refresh_token: refresh_token,
      },
      create: {
        spotify_uri: `spotify:user:${user.id}`,
        spotify_access_token: access_token,
        spotify_refresh_token: refresh_token,
        // Add any other initial fields
      },
    });

    console.log("Upserted User:", upsertedUser);

    const response = NextResponse.redirect(new URL("/dashboard", request.url));

    // Set cookies in the response
    response.cookies.set("spotify_access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    response.cookies.set("spotify_refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    response.cookies.set("user_id", upsertedUser.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Authentication Error:", error);
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          (error as Error).message || "authentication_failed"
        )}`,
        request.url
      )
    );
  }
}
