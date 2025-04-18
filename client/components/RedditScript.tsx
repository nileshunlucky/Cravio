"use client"

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ThumbsUp, MessageSquare, Share2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from './ui/button'
import toast , { Toaster } from 'react-hot-toast'

type RedditStoryProps = {
  value: string;
  onChange: (val: string) => void;
  onNext: () => void;
  onSetFields: (fields: { title: string; username: string; avatar: string }) => void;
};

const RedditStory: React.FC<RedditStoryProps> = ({ onChange, onNext, onSetFields }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [username, setUsername] = useState('ai/Cravio')
  const [title, setTitle] = useState('')
  const [script, setScript] = useState('')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [promptHidden, setPromptHidden] = useState(false)

  const handleNext = () => {
    onChange(script) // just the script value
    onSetFields({
      title,
      username,
      avatar: avatarUrl || '/reddit.png'
    })
    onNext()
  }

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarUrl(URL.createObjectURL(file))
    }
  }

  const generateContent = async () => {
    setLoading(true) // Start loading state
    if (!prompt) {
      toast.error('Please enter a prompt.'); // Notify user to enter a prompt
      setLoading(false) // Stop loading state
      return; 
    } // Make sure there's a prompt
    const formDataToSend = new FormData();
    formDataToSend.append('prompt', prompt);

    // API request to generate title and script
    try {
      const response = await fetch('http://localhost:8000/generate-content', {
        method: 'POST',
        body: formDataToSend,
      })

      if (!response.ok) {
        throw new Error('Failed to generate content')
      }

      const data = await response.json()
      setTitle(data.title)
      setScript(data.script)
      toast.success('Content generated successfully!')
      setPromptHidden(true) // Hide the prompt input after generation
      setLoading(false) // Stop loading state
    } catch (error) {
      toast.error('Error generating content. Please try again.')
      console.error(error)
      setLoading(false) // Stop loading state
    }
  }

  return (
    <div className="min-h-screen w-full space-y-6">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Header Section */}
      {/* Input Section */}
      <div className="flex items-center gap-4">
        <label className="cursor-pointer">
          <img
            src={avatarUrl || '/reddit.png'}
            alt="avatar"
            className="w-12 h-12 rounded-full object-cover border"
          />
          <Input
            type="file"
            accept="image/*"
            onChange={handleAvatar}
            hidden
          />
        </label>

        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="u/username"
          className="flex-1"
          required
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-neutral-700">Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a catchy title..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-neutral-700">Video Script</Label>
        <Textarea
          rows={6}
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Write your video script..."
          required
          maxLength={300}
        />
      </div>

      {/* Prompt Section */}
<div className="space-y-2" hidden={promptHidden}>
  <Label className="text-sm text-neutral-700">Enter a prompt for AI</Label>
  <Input
    disabled={loading}
    value={prompt}
    onChange={(e) => setPrompt(e.target.value)}
    placeholder="Provide a topic, idea, or description..."
    required
  />
  <Button 
    disabled={loading} 
    onClick={generateContent} 
    className="w-full relative"
  >
    {loading ? (
      <span className="flex items-center justify-center">
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Generating...</span>
      </span>
    ) : (
      'Generate Title & Script'
    )}
  </Button>
</div>
      {/* Preview Section */}
      <Label className="text-sm text-neutral-700">Reddit-Style Preview</Label>
      <div className="border rounded-md bg-white shadow-sm p-4 space-y-4">
        <div className="flex items-center gap-3">
          <img
            src={avatarUrl || '/reddit.png'}
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover border"
          />
          <div className="flex items-center gap-1 text-sm font-medium text-neutral-800">
            {username || 'u/username'}
            <Image src='/verify.webp' alt="verified" width={16} height={16} className="w-4 h-4" />
          </div>
        </div>

        <div className="text-lg font-semibold text-neutral-900">
          {title || 'Your title will appear here'}
        </div>

        <div className="text-sm text-neutral-700 whitespace-pre-line">
          {script || 'Your video script preview will appear here...'}
        </div>

        {/* Reddit-style footer */}
        <div className="flex items-center gap-6 text-sm text-neutral-600 pt-2">
          <div className="flex items-center gap-1 hover:text-red-500 cursor-pointer">
            <ThumbsUp className="w-4 h-4" />
            <span>1.4k</span>
          </div>
          <div className="flex items-center gap-1 hover:text-blue-500 cursor-pointer">
            <MessageSquare className="w-4 h-4" />
            <span>327</span>
          </div>
          <div className="flex items-center justify-end gap-1 hover:text-green-500 cursor-pointer">
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </div>
        </div>
        <Button onClick={handleNext} className="fixed bottom-5 right-[50%] translate-x-1/2">Next</Button>
      </div>
    </div>
  )
}

export default RedditStory
