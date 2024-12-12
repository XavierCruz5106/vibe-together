import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken, getUserProfile } from '@/lib/spotify'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${error}`, request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  try {
    const tokenResponse = await getAccessToken(code)
    
    if ('error' in tokenResponse) {
      throw new Error(tokenResponse.error_description || tokenResponse.error)
    }

    const { access_token, refresh_token } = tokenResponse
    const user = await getUserProfile(access_token)

    const response = NextResponse.redirect(new URL('/dashboard', request.url))

    // Set cookies in the response
    response.cookies.set('spotify_access_token', access_token, { 
      httpOnly: true, 
      secure: true,
      sameSite: 'lax'
    })
    
    response.cookies.set('spotify_refresh_token', refresh_token, {
      httpOnly: true, 
      secure: true,
      sameSite: 'lax'
    })
    
    response.cookies.set('user_id', user.id, {
      httpOnly: true, 
      secure: true,
      sameSite: 'lax'
    })

    return response
  } catch (error) {
    console.error('Error during authentication:', error)
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent((error as Error).message || 'authentication_failed')}`, request.url))
  }
}

