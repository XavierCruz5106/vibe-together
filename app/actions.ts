'use server'

import { cookies } from 'next/headers'
import { getAccessToken, getUserProfile } from '@/lib/spotify'
import { redirect } from 'next/navigation'

export async function handleSpotifyCallback(code: string) {
  try {
    const tokenResponse = await getAccessToken(code)
    
    if ('error' in tokenResponse) {
      throw new Error(tokenResponse.error_description || tokenResponse.error)
    }

    const { access_token, refresh_token } = tokenResponse
    const user = await getUserProfile(access_token)

    // Set cookies in the server action
    cookies().set('spotify_access_token', access_token, { 
      httpOnly: true, 
      secure: true,
      sameSite: 'lax'
    })
    
    cookies().set('spotify_refresh_token', refresh_token, {
      httpOnly: true, 
      secure: true,
      sameSite: 'lax'
    })
    
    cookies().set('user_id', user.id, {
      httpOnly: true, 
      secure: true,
      sameSite: 'lax'
    })

    return { success: true }
  } catch (error) {
    console.error('Error during authentication:', error)
    return { 
      success: false, 
      error: (error as Error).message || 'authentication_failed'
    }
  }
}

