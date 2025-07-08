'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { Download, Eye, Calendar, Sparkles, Grid, Heart, Share2, MoreHorizontal } from 'lucide-react'

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
  const [downloadingItems, setDownloadingItems] = useState<Set<string>>(new Set())

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

  const handleDirectDownload = async (url: string, filename: string, jobId: string) => {
    setDownloadingItems(prev => new Set(prev).add(jobId))
    
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback to direct link
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      link.setAttribute('target', '_blank')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } finally {
      setTimeout(() => {
        setDownloadingItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(jobId)
          return newSet
        })
      }, 1000)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 20
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-[#B08D57] to-[#D4AF37] rounded-full mx-auto mb-4 animate-pulse" />
            <Skeleton className="h-8 w-48 mx-auto mb-2 bg-zinc-800" />
            <Skeleton className="h-4 w-64 mx-auto bg-zinc-800" />
          </div>
          
          {/* Stats Skeleton */}
          <div className="flex justify-center gap-8 mb-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-6 w-12 mx-auto mb-1 bg-zinc-800" />
                <Skeleton className="h-4 w-16 mx-auto bg-zinc-800" />
              </div>
            ))}
          </div>
          
          {/* Grid Skeleton */}
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square">
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
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#B08D57] to-[#D4AF37] rounded-full mx-auto mb-4 opacity-20" />
          <h2 className="text-2xl font-light text-white mb-2">No Data Found</h2>
          <p className="text-gray-500">Unable to load your portfolio data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="relative mb-6">
            <div 
              className="w-20 h-20 bg-gradient-to-br from-[#B08D57] to-[#D4AF37] rounded-full mx-auto flex items-center justify-center shadow-lg"
              style={{ 
                boxShadow: '0 0 30px rgba(176, 141, 87, 0.3)' 
              }}
            >
              <Sparkles className="h-10 w-10 text-black" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#B08D57] rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-2xl font-light text-white mb-2">
            {user?.firstName || 'Creative'} {user?.lastName || 'Artist'}
          </h1>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
            AI-powered creative portfolio • Digital art & design
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center gap-8 mb-12 pb-8 border-b border-gray-800"
        >
          <div className="text-center">
            <div className="text-xl font-light text-white">{userData?.thumbnail?.length || 0}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-light text-white">{userData?.credits || 0}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Credits</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-light text-[#B08D57]">
              {userData?.user_paid ? 'PRO' : 'FREE'}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Plan</div>
          </div>
        </motion.div>

        {/* Gallery */}
        <AnimatePresence>
          {userData?.thumbnail?.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-16 h-16 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Grid className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-light text-white mb-2">No posts yet</h3>
              <p className="text-gray-400 text-sm">Start creating to build your portfolio</p>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-3 gap-1"
            >
              {userData?.thumbnail?.map((thumbnail, index) => {
                const thumbnailUrl = getThumbnailUrl(thumbnail, userData.user_paid)
                const isLoading = imageLoading[thumbnail.job_id] !== false
                const isHovered = hoveredCard === thumbnail.job_id

                return (
                  <motion.div
                    key={thumbnail.job_id}
                    variants={itemVariants}
                    className="group cursor-pointer relative"
                    onMouseEnter={() => setHoveredCard(thumbnail.job_id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-900">
                      {isLoading && (
                        <div className="absolute inset-0 bg-gray-900 animate-pulse flex items-center justify-center">
                          <div className="w-4 h-4 bg-gray-700 rounded-full animate-bounce" />
                        </div>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="relative w-full h-full">
                            <img
                              src={thumbnailUrl}
                              alt={`${thumbnail.model} creation`}
                              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                              onLoad={() => handleImageLoad(thumbnail.job_id)}
                              onError={() => handleImageError(thumbnail.job_id)}
                              loading="lazy"
                            />
                            
                            {/* Hover overlay */}
                            <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'} flex items-center justify-center`}>
                              <div className="flex items-center gap-4 text-white">
                                <div className="flex items-center gap-1">
                                  <Eye className="h-5 w-5" />
                                  <span className="text-sm font-medium">View</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Heart className="h-5 w-5" />
                                  <span className="text-sm font-medium">{Math.floor(Math.random() * 50) + 10}</span>
                                </div>
                              </div>
                            </div>

                            {/* Model badge */}
                            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <Badge className="bg-black/80 text-[#B08D57] border-[#B08D57] text-xs px-2 py-1">
                                {thumbnail.model}
                              </Badge>
                            </div>
                          </div>
                        </DialogTrigger>
                        
                        <DialogContent className="max-w-5xl p-0 border-0 bg-black/95 backdrop-blur-xl">
                          <DialogTitle className="sr-only">
                            {thumbnail.model} creation - Full view
                          </DialogTitle>
                          <div className="flex h-[90vh]">
                            {/* Image */}
                            <div className="flex-1 flex items-center justify-center p-4">
                              <img
                                src={thumbnailUrl}
                                alt={`${thumbnail.model} creation`}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            
                            {/* Sidebar */}
                            <div className="w-80 bg-black/50 backdrop-blur-xl border-l border-gray-800 flex flex-col">
                              {/* Header */}
                              <div className="p-4 border-b border-gray-800">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-[#B08D57] to-[#D4AF37] rounded-full flex items-center justify-center">
                                      <Sparkles className="h-4 w-4 text-black" />
                                    </div>
                                    <div>
                                      <div className="text-white font-medium text-sm">
                                        {user?.firstName || 'Creative'} {user?.lastName || 'Artist'}
                                      </div>
                                      <div className="text-gray-400 text-xs">{thumbnail.model}</div>
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="sm" className="text-gray-400">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 p-4">
                                <div className="mb-4">
                                  <div className="flex items-center gap-4 mb-3">
                                    <Button variant="ghost" size="sm" className="text-white hover:text-[#B08D57] p-0">
                                      <Heart className="h-6 w-6" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-white hover:text-[#B08D57] p-0">
                                      <Share2 className="h-6 w-6" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-white hover:text-[#B08D57] p-0"
                                      onClick={() => handleDirectDownload(
                                        thumbnailUrl || '', 
                                        `${thumbnail.model}_${thumbnail.job_id.split('-')[0]}.jpg`,
                                        thumbnail.job_id
                                      )}
                                      disabled={downloadingItems.has(thumbnail.job_id)}
                                    >
                                      <Download className={`h-6 w-6 ${downloadingItems.has(thumbnail.job_id) ? 'animate-bounce' : ''}`} />
                                    </Button>
                                  </div>
                                  
                                  <div className="text-white text-sm mb-2">
                                    <span className="font-medium">{Math.floor(Math.random() * 50) + 10} likes</span>
                                  </div>
                                  
                                  <div className="text-gray-300 text-sm">
                                    <span className="font-medium text-white">
                                      {user?.firstName || 'Creative'}
                                    </span>{' '}
                                    AI-generated artwork using {thumbnail.model}
                                  </div>
                                </div>
                                
                                <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">
                                  {formatDate(thumbnail.created_at)}
                                </div>
                                
                                <div className="text-gray-500 text-xs">
                                  Job ID: {thumbnail.job_id}
                                </div>
                              </div>
                              
                              {/* Download Button */}
                              <div className="p-4 border-t border-gray-800">
                                <Button
                                  className="w-full bg-gradient-to-r from-[#B08D57] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#B08D57] text-black font-medium transition-all duration-300"
                                  onClick={() => handleDirectDownload(
                                    thumbnailUrl || '', 
                                    `${thumbnail.model}_${thumbnail.job_id.split('-')[0]}.jpg`,
                                    thumbnail.job_id
                                  )}
                                  disabled={downloadingItems.has(thumbnail.job_id)}
                                  style={{ 
                                    boxShadow: downloadingItems.has(thumbnail.job_id) 
                                      ? '0 0 20px rgba(176, 141, 87, 0.5)' 
                                      : '0 0 20px rgba(176, 141, 87, 0.3)' 
                                  }}
                                >
                                  {downloadingItems.has(thumbnail.job_id) ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                      Downloading...
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <Download className="h-4 w-4" />
                                      Download HD
                                    </div>
                                  )}
                                </Button>
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