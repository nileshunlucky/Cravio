'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Download, Copy, CheckCircle2, X, MessageCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type VideoType = {
  url: string
  title: string
  script: string
  caption: string
  created_at: string
}

export default function ProjectPage() {
  const { user } = useUser()
  const [videos, setVideos] = useState<VideoType[]>([])
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const fetchVideos = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return
      const email = user.primaryEmailAddress.emailAddress
      
      setLoading(true)
      try {
        const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`)
        const data = await res.json()
        console.log(data?.opusclips)
        if (data.videos) {
          // Sort videos by created_at in descending order to show the latest first
          const sortedVideos = data.videos.sort((a: VideoType, b: VideoType) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          })
          setVideos(sortedVideos)
        }
      } catch (error) {
        console.error('Error fetching videos:', error)
      } finally {
        setLoading(false)
      }
    }

    const deleteOldVideos = async () => {
      try {
        const res = await fetch('https://cravio-ai.onrender.com/delete_old_videos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user?.primaryEmailAddress?.emailAddress
          }),
        })
        const data = await res.json()
    
        if (res.ok) {
          console.log('[Auto Delete] Success:', data.detail)
        } else {
          console.warn('[Auto Delete] Warning:', data.detail)
        }
      } catch (err) {
        console.error('[Auto Delete] Error:', err)
      }
    }  
    
    if (user) {
      fetchVideos()
      deleteOldVideos()
    }
  }, [user])

  // Format date to a user-friendly display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  // Copy caption to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  // Loading skeleton for video cards
  const VideoSkeleton = () => (
    <div className="rounded-lg overflow-hidden">
      <Skeleton className="w-full h-48" />
      <div className="p-2 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">My Videos</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <VideoSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ">
          {videos.map((video, index) => (
            <Dialog key={index} open={isDialogOpen && selectedVideo?.url === video.url} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) setSelectedVideo(null)
            }}>
              <DialogTrigger asChild>
                <motion.div 
                  className="cursor-pointer" 
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  onClick={() => {
                    setSelectedVideo(video)
                    setIsDialogOpen(true)
                  }}
                >
                  <Card className="overflow-hidden rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <div className="relative">
                      <video 
                        src={video.url} 
                        className="w-full h-48 object-cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-3">
                        <p className="text-white text-xs line-clamp-2">{video.caption}</p>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm line-clamp-1">{video.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(video.created_at)}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </DialogTrigger>

              {selectedVideo && (
<DialogContent className="max-w-3xl w-full p-0 overflow-hidden rounded-lg h-[90vh] md:h-[85vh]">
      <div className="sr-only">
        <DialogTitle>{selectedVideo.title}</DialogTitle>
        <DialogDescription>Video details and controls</DialogDescription>
      </div>
      
      <div className="flex flex-col h-full">
        {/* Mobile close button */}
        <div className="absolute right-4 top-4 z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            className="bg-black/30 hover:bg-black/40 rounded-full text-white"
            onClick={() => setIsDialogOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Video Section */}
        <div className="w-full bg-black flex items-center justify-center flex-shrink-0">
          <video 
            src={selectedVideo.url} 
            controls 
            className="w-full max-h-[40vh] md:max-h-[50vh] object-contain" 
            autoPlay
          />
        </div>
        
        {/* Content Section with proper scrolling */}
        <div className="flex-grow bg-white flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 flex items-center border-b flex-shrink-0">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={user?.imageUrl || ''} />
              <AvatarFallback>{user?.firstName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <p className="text-sm font-medium">{user?.fullName || 'User'}</p>
              <p className="text-xs text-gray-500">{formatDate(selectedVideo.created_at)}</p>
            </div>
            <a href={selectedVideo.url} download className="no-underline" target='_blank'>
              <Button variant="ghost" size="sm" className="gap-1">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </a>
          </div>
          
          {/* Title */}
          <div className="px-4 py-2 flex-shrink-0">
            <h2 className="text-base font-semibold">{selectedVideo.title}</h2>
          </div>
          
          {/* Tabs with scrollable content */}
          <Tabs defaultValue="caption" className="flex flex-col flex-grow overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
              <TabsTrigger value="caption" className="text-sm">
                <Copy className="h-4 w-4 mr-2" />
                Caption
              </TabsTrigger>
              <TabsTrigger value="script" className="text-sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Script
              </TabsTrigger>
            </TabsList>
            
            {/* Caption Tab */}
            <TabsContent 
              value="caption" 
              className="flex-1 overflow-auto p-4"
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-4 sticky top-0 bg-white pb-2 z-10">
                  <h3 className="text-sm font-medium">Caption</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2"
                          onClick={() => copyToClipboard(selectedVideo.caption || "")}
                        >
                          {copied ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{copied ? "Copied!" : "Copy caption"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg flex-1 overflow-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedVideo.caption || "No caption available"}
                  </p>
                </div>
              </div>
            </TabsContent>
            
            {/* Script Tab */}
            <TabsContent 
              value="script" 
              className="flex-1 overflow-auto p-4"
            >
              <div className="flex flex-col h-full">
                <div className="sticky top-0 bg-white pb-2 z-10">
                  <h3 className="text-sm font-medium">Script</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg flex-1 overflow-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedVideo.script || "No script available"}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DialogContent>
              )}
            </Dialog>
          ))}
        </div>
      )}
      
      {!loading && videos.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-700">No videos yet</h3>
          <p className="text-gray-500 mt-2">Your created videos will appear here</p>
        </div>
      )}
    </div>
  )
}