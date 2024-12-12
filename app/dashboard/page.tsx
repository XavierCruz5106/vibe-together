import { cookies } from 'next/headers'
import { getCurrentlyPlaying } from '@/lib/spotify'
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { redirect } from 'next/navigation'
import ClientComponent from './client-dashboard'

async function fetchCurrentlyPlaying(accessToken: string) {
  const currentlyPlaying = await getCurrentlyPlaying(accessToken)
  return currentlyPlaying
}

export default async function Dashboard() {
  const cookieStore = cookies()
  const accessToken = (await cookieStore).get('spotify_access_token')?.value

  if (!accessToken) {
    redirect('/login')
  }

  const currentlyPlaying = await fetchCurrentlyPlaying(accessToken)

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-400 to-blue-500 p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Your Vibe</h1>
      <ClientComponent currentlyPlaying={currentlyPlaying} accessToken={accessToken} />
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Connected Friends</h2>
        <p className="text-lg mb-4">You haven't connected with any friends yet.</p>
        <Button asChild>
          <Link href="/connect" className="bg-blue-500 text-white px-4 py-2 rounded">
            Connect with Friends
          </Link>
        </Button>
      </div>
    </div>
  )
}