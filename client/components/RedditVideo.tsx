'use client'

import React, { useState } from 'react'
import { Button } from './ui/button'
import clsx from 'clsx'

const videos = [
  { title: 'Satisfy', video: 'https://res.cloudinary.com/db17zxsjc/video/upload/v1744903431/Gameplay/satisfy.mp4' },
  { title: 'GTA', video: 'https://res.cloudinary.com/db17zxsjc/video/upload/v1744903426/Gameplay/gta.mp4' },
  { title: 'Minecraft', video: 'https://res.cloudinary.com/db17zxsjc/video/upload/v1744903105/Gameplay/minecraft.mp4' }
]

type RedditVideoProps = {
  value: string
  onChange: (videoUrl: string) => void
  onNext: () => void
  onBack: () => void
}
const RedditVideo = ({ value, onChange, onNext, onBack }: RedditVideoProps) => {
  const [selected, setSelected] = useState<number>(value ? parseInt(value, 10) : 0)
  const handleNext = () => {
    onChange(videos[selected]?.video || 'fortnite.mp4')  // Passing only the filename
    onNext()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Select a Gameplay Video</h2>

      <div className="grid grid-cols-2 gap-4">
        {videos.map((video, index) => (
          <div
            key={index}
            className={clsx(
              'rounded-md border p-2 transition shadow-sm cursor-pointer',
              selected === index ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'
            )}
            onClick={() => setSelected(index)}
          >
            <video
              autoPlay
              muted
              loop
              className="w-full h-full object-cover rounded"
              src={video.video}  // Using the video filename
            />
            <p className="mt-2 text-center text-sm font-medium">{video.title}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  )
}

export default RedditVideo
