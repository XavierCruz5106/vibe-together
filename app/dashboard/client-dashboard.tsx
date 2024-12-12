'use client'

import { useEffect, useState } from 'react'
import { getCurrentlyPlaying } from '@/lib/spotify'

interface ClientComponentProps {
  currentlyPlaying: any
  accessToken: string
}

export default function ClientComponent({ currentlyPlaying, accessToken }: ClientComponentProps) {
  const [currentTrack, setCurrentTrack] = useState(currentlyPlaying)

  const fetchCurrentlyPlaying = async () => {
    const data = await getCurrentlyPlaying(accessToken)
    setCurrentTrack(data)
  }

  useEffect(() => {
    const intervalId = setInterval(fetchCurrentlyPlaying, 5000)

    return () => clearInterval(intervalId) // Clean up interval on unmount
  }, [accessToken])

  return (
    <div>
      {currentTrack && currentTrack.item ? (
        <div className="bg-white rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-center">Currently Playing</h2>
          <img
            className="w-64 h-64 mx-auto mb-4 rounded-lg shadow-md"
            src={currentTrack.item.album.images[0].url}
            alt="cover"
          />
          <p className="text-xl text-center">{currentTrack.item.name} by {currentTrack.item.artists[0].name}</p>
          <p className="text-xl text-center">{currentTrack.item.album.name}</p>
      </div>
      ) : (
        <div className="bg-white rounded-lg p-6 mb-8">
          <p className="text-xl">Not currently playing any track</p>
        </div>
      )}
    </div>
  )
}