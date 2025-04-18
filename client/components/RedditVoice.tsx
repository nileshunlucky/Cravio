'use client'

import React, { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Loader2, Play, Tally2 } from 'lucide-react'

const voices = [
  { id: 'nova', name: 'Nova', gender: 'Female', lang: 'English', preview: '/voice/nova.mpeg' },
  { id: 'shimmer', name: 'Shimmer', gender: 'Female', lang: 'English', preview: '/voice/shimmer.mpeg' },
  { id: 'echo', name: 'Echo', gender: 'Male', lang: 'English', preview: '/voice/echo.mpeg' },
  { id: 'onyx', name: 'Onyx', gender: 'Male', lang: 'English', preview: '/voice/onyx.mpeg' },
  { id: 'fable', name: 'Fable', gender: 'Male', lang: 'English', preview: '/voice/fable.mpeg' },
  { id: 'alloy', name: 'Alloy', gender: 'Male', lang: 'English', preview: '/voice/alloy.mpeg' },
  { id: 'ash', name: 'Ash', gender: 'Male', lang: 'English', preview: '/voice/ash.mpeg' },
  { id: 'coral', name: 'Coral', gender: 'Male', lang: 'English', preview: '/voice/coral.mpeg' },
  { id: 'sage', name: 'Sage', gender: 'Male', lang: 'English', preview: '/voice/sage.mpeg' },
]

const RedditVoice = ({ value, onChange, onSubmit, onBack, loading }: any) => {
  const [selected, setSelected] = useState(value || '')
  const [playing, setPlaying] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handleSelect = (voiceId: string) => {
    setSelected(voiceId)
    onChange(voiceId) // update parent immediately
  }

  const playVoice = (voiceId: string) => {
    const voice = voices.find((v) => v.id === voiceId)
    if (!voice) return
  
    if (playing === voiceId) {
      // Stop current
      audioRef.current?.pause()
      if (audioRef.current) {
        audioRef.current.currentTime = 0
      }
      setPlaying(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      const audio = new Audio(voice.preview)
      audioRef.current = audio
      audio.play()
      setPlaying(voiceId)
  
      audio.onended = () => {
        setPlaying(null)
      }
    }
  }
  

  const handleSubmit = () => {
    if (selected) {
      onChange(selected)
      onSubmit()
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Select a Voice</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {voices.map((voice) => (
          <div
            key={voice.id}
            className={`border p-4 rounded-md shadow-sm cursor-pointer transition ${selected === voice.id ? 'border-blue-500 bg-blue-50' : 'bg-white'
              }`}
            onClick={() => handleSelect(voice.id)}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{voice.name}</h3>
                <p className="text-sm text-gray-600">{voice.gender} • {voice.lang}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  playVoice(voice.id)
                }}
                className="text-blue-600 hover:underline text-sm"
              >
                {playing === voice.id ? <Tally2 /> : <Play />}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-6 ">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button disabled={!selected || loading} onClick={handleSubmit}>
          {loading ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" />
              Generating...
            </>
          ) : (
            'Generate Video'
          )}
        </Button>
      </div>
    </div>
  )
}

export default RedditVoice
