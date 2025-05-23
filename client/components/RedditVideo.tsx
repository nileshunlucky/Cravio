import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import clsx from 'clsx'

const videos = [
  { title: 'Satisfy', video: 'https://res.cloudinary.com/db17zxsjc/video/upload/v1744903431/Gameplay/satisfy.mp4' },
  { title: 'Satisfy 2', video: 'https://res.cloudinary.com/db17zxsjc/video/upload/v1745655668/Gameplay/xkf8hozjsju8ubsvoluq.mp4' },
  { title: 'Minecraft', video: 'https://res.cloudinary.com/db17zxsjc/video/upload/v1744903105/Gameplay/minecraft.mp4' },
  { title: 'Minecraft 2', video: 'https://res.cloudinary.com/db17zxsjc/video/upload/v1745682637/Gameplay/vcmp42bdsn2jjyniioo4.mp4' },
  { title: 'SubwaySuffer ', video: 'https://res.cloudinary.com/db17zxsjc/video/upload/v1745432173/Gameplay/subwaysuffer2.mp4' },
  { title: 'SubwaySuffer 2', video: 'https://res.cloudinary.com/db17zxsjc/video/upload/v1745682636/Gameplay/uhhqc3foigcirf10xoag.mp4' },
]

type RedditVideoProps = {
  value: string
  onChange: (videoUrl: string) => void
  onNext: () => void
  onBack: () => void
}

const RedditVideo = ({ value, onChange, onNext, onBack }: RedditVideoProps) => {
  // Set default video to "Satisfy" or from value if passed
  const defaultVideoIndex = videos.findIndex((video) => video.video === value) !== -1 ? 
    videos.findIndex((video) => video.video === value) : 0;
  const [selected, setSelected] = useState<number>(defaultVideoIndex)

  useEffect(() => {
    // Whenever the selected video changes, update parent component
    onChange(videos[selected]?.video)
  }, [selected, onChange]);

  const handleNext = () => {
    onChange(videos[selected]?.video)
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
              selected === index ? 'border-blue-600 ' : ''
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
