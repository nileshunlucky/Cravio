'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { Download, Eye, Calendar, Sparkles } from 'lucide-react'

interface Thumbnail {
  model: string
  watermarked_url?: string
  original_url?: string
  job_id: string
  watermarked: boolean
  created_at: {
    $date: string
  }
}

interface UserData {
  email: string
  credits: number
  user_paid: boolean
  thumbnail: Thumbnail[]
}

const PortfolioPage = () => {
  const { user } = useUser()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({})
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.emailAddresses?.[0]?.emailAddress) return

      const email = user.emailAddresses[0].emailAddress

      try {
        const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`)
        const data = await res.json()

        if (res.ok) {
          setUserData(data)
        } else {
          console.error("Error from server:", data)
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user])

  const handleImageLoad = (jobId: string) => {
    setImageLoading(prev => ({ ...prev, [jobId]: false }))
  }

  const handleImageError = (jobId: string) => {
    setImageLoading(prev => ({ ...prev, [jobId]: false }))
  }

  const getThumbnailUrl = (thumbnail: Thumbnail, isPaid: boolean) => {
    if (isPaid && thumbnail.original_url) {
      return thumbnail.original_url
    }
    return thumbnail.watermarked_url || thumbnail.original_url
  }

const formatDate = (rawDate: string | { $date: string }) => {
  try {
    const dateString =
      typeof rawDate === 'string' ? rawDate :
      typeof rawDate?.$date === 'string' ? rawDate.$date :
      null;

    if (!dateString) return 'Invalid Date';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date: ' + error;
  }
};


const handleDirectDownload = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  link.setAttribute('target', '_blank'); // ensures fallback even if download fails
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-64 mx-auto mb-4 bg-zinc-800" />
            <Skeleton className="h-4 w-96 mx-auto bg-zinc-800" />
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-0.5 sm:gap-1 md:gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-video">
                <Skeleton className="w-full h-full bg-zinc-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="p-8 text-center bg-gray-900 border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-2">No Data Found</h2>
          <p className="text-gray-400">Unable to load your portfolio data.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-[#47FFE7]" style={{ filter: 'drop-shadow(0 0 8px #47FFE7)' }} />
            <h1 className="text-2xl sm:text-4xl font-bold text-white">
              Your Creative Portfolio
            </h1>
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-[#47FFE7]" style={{ filter: 'drop-shadow(0 0 8px #47FFE7)' }} />
          </div>
          <p className="text-sm sm:text-lg text-[#47FFE7] max-w-2xl mx-auto">
            Showcase your AI-generated masterpieces in a beautiful and engaging way.
          </p>
        </motion.div>

        {/* Gallery */}
        <AnimatePresence>
          {userData?.thumbnail?.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">No Images Yet</h3>
              <p className="text-[#47FFE7] ">Start creating to see your masterpieces here!</p>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
            >
              {userData?.thumbnail?.map((thumbnail) => {
                const thumbnailUrl = getThumbnailUrl(thumbnail, userData.user_paid)
                const isLoading = imageLoading[thumbnail.job_id] !== false
                const isHovered = hoveredCard === thumbnail.job_id

                return (
                  <motion.div
                    key={thumbnail.job_id}
                    variants={itemVariants}
                    className="group cursor-pointer"
                    onMouseEnter={() => setHoveredCard(thumbnail.job_id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className="relative aspect-video overflow-hidden bg-gray-900 border-0 sm:border sm:border-gray-800 hover:border-[#47FFE7] transition-all duration-300">
                      {isLoading && (
                        <div className="absolute inset-0 bg-gray-900 animate-pulse flex items-center justify-center">
                          <div className="text-gray-500 text-sm">Loading...</div>
                        </div>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="relative w-full h-full">
                            <img
                              src={thumbnailUrl}
                              alt={`${thumbnail.model} creation`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onLoad={() => handleImageLoad(thumbnail.job_id)}
                              onError={() => handleImageError(thumbnail.job_id)}
                              loading="lazy"
                            />
                            
                            {/* Simple overlay for desktop */}
                            <div className={`absolute inset-0 bg-black/0  group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center ${isHovered ? 'opacity-100' : 'opacity-0'} hidden sm:flex`}>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="bg-white/90 text-black backdrop-blur-sm hover:bg-white"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </div>

                            {/* Model badge */}
                            <div className="absolute top-1 left-1 sm:top-2 sm:left-2">
                              <Badge className="bg-black/70 text-[#47FFE7] border-[#47FFE7] text-xs px-1 py-0.5 sm:px-2 sm:py-1">
                                {thumbnail.model}
                              </Badge>
                            </div>

                            {/* Date */}
                            <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2">
                              <div className="bg-black/70 text-white text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span className="hidden sm:inline">{formatDate(thumbnail.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </DialogTrigger>
                        
                        <DialogContent className="max-w-4xl p-0 border-0 bg-black">
                          <DialogTitle className="sr-only">
                            {thumbnail.model} creation - Full view
                          </DialogTitle>
                          <div className="relative">
                            <img
                              src={thumbnailUrl}
                              alt={`${thumbnail.model} creation`}
                              className="w-full h-auto max-h-[80vh] object-contain"
                            />
                            
                            {/* Simple action bar */}
                            <div className="absolute -bottom-10 md:bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                  <p className="text-white font-medium md:flex hidden">{thumbnail.model} Creation</p>
                                  <p className="text-xs text-gray-400 flex items-center">
                                    <span className='md:flex hidden'>Created: </span> {formatDate(thumbnail.created_at)}
                                  </p>
                                  <p className="text-xs text-gray-400 md:flex hidden">
                                    Job ID: {thumbnail.job_id}
                                  </p>
                                </div>
                                {thumbnailUrl ? (
                                  <Button
                                    size="sm"
                                    className="bg-[#47FFE7] hover:bg-[#47FFE7]/80 text-black"
                                    onClick={() => handleDirectDownload(thumbnailUrl, `${thumbnail.model}_${thumbnail.job_id.split('-')[0]}.jpg`)}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default PortfolioPage