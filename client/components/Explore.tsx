"use client"

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'

type MediaItem = {
  id: number
  seoName: string
  image?: string
  video?: string
  prompt: string
}

// Mock AI media data with prompts
const mediaData: MediaItem[] = [
  {
    id: 1,
    seoName: "cute-brunette-model-playful-outdoor-portrait",
    image: "https://i.pinimg.com/736x/ae/45/80/ae458008232fa4c6196b8f169f71d1e1.jpg",
    prompt: "Ultra-realistic portrait of a playful brunette woman outdoors, sticking out her tongue and looking upwards with a fun expression, wearing a tight green crop top and light gray shorts, layered gold necklaces around her neck, natural makeup with flushed cheeks, long tied-back hair with loose strands, background showing wooden deck, green grass, bushes, and a calm lake with blue sky and clouds, daylight natural lighting, cinematic outdoor vibe, sharp details, professional high-quality photography, 8K resolution"
  },
  {
    id: 2,
    seoName: "brunette-black-bodysuit-crouching-pose-high-heels-studio",
    image: "https://i.pinimg.com/1200x/59/9c/96/599c96a5a4a566971cafab2f6a9fed81.jpg",
    prompt: "Ultra-realistic portrait of a brunette woman with long wavy layered hair in a professional studio photoshoot, wearing a black long-sleeved bodysuit with cutout details, crouching pose with confident expression looking over shoulder, black strappy high heel sandals with ankle straps, athletic feminine figure, flawless skin and natural makeup, dramatic studio lighting against neutral beige background, modern fashion photography style, sophisticated sensual aesthetic, high detail, commercial photography quality, 8K resolution"
  },
  {
    id: 3,
    seoName: "blonde-bikini-cooking-kitchen-luxury-home-domestic-lifestyle",
    image: "https://i.pinimg.com/736x/77/65/83/776583ede4b82090d709e421e68d3fef.jpg",
    prompt: "Ultra-realistic portrait of a blonde woman with long wavy hair cooking in a luxury modern kitchen, wearing a black triangle bikini top and matching bottoms, visible thigh tattoo with text, cooking vegetables in a stainless steel pan on gas stovetop, confident domestic pose, upscale white kitchen with coffered blue ceiling, white cabinetry and marble countertops, large windows with natural daylight, stainless steel appliances, lifestyle photography aesthetic, modern luxury home interior, casual domestic scene, high detail, professional photography quality, 8K resolution"
  },
  {
    id: 4,
    seoName: "brunette-gray-sweater-cozy-couch-living-room-casual-intimate",
    image: "https://i.pinimg.com/736x/fd/31/4c/fd314c7f38413ed0fdcffa356938ff85.jpg",
    prompt: "Ultra-realistic portrait of a brunette woman with long layered hair sitting on a beige sectional couch, wearing an oversized gray off-shoulder sweater, white ankle socks, relaxed intimate pose with hand in hair, cozy modern living room setting with neutral beige throw blanket with fringe details, William Morris botanical art prints on white wall, natural indoor lighting, casual lifestyle photography, comfortable home aesthetic, intimate feminine mood, high detail, candid photography style, 8K resolution"
  },
  {
    id: 5,
    seoName: "woman-riding-motorcycle-riding-horse",
    img: "https://higgsfield.ai/_next/image?url=https%3A%2F%2Fd1xarpci4ikg0w.cloudfront.net%2F6a1030ec-a3db-450f-ad66-f0c47d7467fd.webp&w=240&q=75",
    video: "https://d1xarpci4ikg0w.cloudfront.net/65cbb5d5-9e84-4764-b4c0-55bdd6a52379.mp4",
    prompt: "A young woman in a translucent white raincoat stands on a long pier extending into the ocean, her wet hair swept by the wind. The sky is stormy and dramatic, with dark clouds over the horizon and the sea beneath her. Her gaze is calm yet intense as she looks directly into the camera. The camera begins close-up, centered on her face and hood, capturing the moody ambiance of the scene. Suddenly, the camera begins a fast and seamless zoom-out. She remains completely motionless as the view pulls back—past the pier, above the sea, over the coastline, and then rapidly ascends through the cloudy sky. The scene transitions through the atmosphere into outer space, revealing a clean, photorealistic Earth slowly rotating in the darkness. No overlays or extra effects — just a single glowing dot marking her original position on the planet."
  },
]

// Function to shuffle array randomly
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Skeleton component
const ImageSkeleton = ({ height }: { height: number }) => (
  <div className="break-inside-avoid mb-2">
    <div className="bg-zinc-900/50 rounded-2xl overflow-hidden shadow-lg">
      <div className="animate-pulse">
        <div className="bg-zinc-800 w-full rounded-2xl" style={{ height: `${height}px` }}></div>
      </div>
    </div>
  </div>
)

const MediaCard = ({ item, index }: { item: MediaItem; index: number }) => {
  const [mediaLoaded, setMediaLoaded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(cardRef, { once: true, margin: "100px" })
  const router = useRouter()

  const getRandomHeight = () => {
    const heights = [250, 300, 350, 280, 320, 400, 380, 260, 420, 340]
    return heights[item.id % heights.length]
  }

  const handleMediaLoad = () => {
    setMediaLoaded(true)
  }

  const handleMediaClick = () => {
    const encodedPrompt = encodeURIComponent(item.prompt)
    
    if (item.image) {
        const encodedImage = encodeURIComponent(item.image)
        router.push(`/admin/canvas?prompt=${encodedPrompt}&referenceImage=${encodedImage}`)
    } 
    else if (item.video) {
        const encodedVideoImg = encodeURIComponent(item.img)
        router.push(`/admin/opus?prompt=${encodedPrompt}&referenceImage=${encodedVideoImg}`)
    }
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ 
        delay: index * 0.05, 
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="break-inside-avoid mb-2 group cursor-pointer"
      onClick={handleMediaClick}
    >
      <div className="relative bg-zinc-900/20 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
        <div className="relative overflow-hidden rounded-2xl">
          {!mediaLoaded && (
            <div 
              className="absolute inset-0 bg-zinc-800 animate-pulse rounded-2xl" 
              style={{ height: `${getRandomHeight()}px` }} 
            />
          )}
          
          {/* Render image or video based on what's available */}
          {item.image ? (
            <img
              src={item.image}
              alt={item.seoName}
              className={`w-full object-cover transition-all duration-500 rounded-2xl ${
                mediaLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ 
                height: mediaLoaded ? 'auto' : `${getRandomHeight()}px`,
                minHeight: '200px',
                maxHeight: '500px'
              }}
              loading="lazy"
              onLoad={handleMediaLoad}
            />
          ) : item.video ? (
            <video
              src={item.video}
              className={`w-full object-cover transition-all duration-500 rounded-2xl ${
                mediaLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ 
                height: mediaLoaded ? 'auto' : `${getRandomHeight()}px`,
                minHeight: '200px',
                maxHeight: '500px'
              }}
              muted
              loop
              autoPlay
              onLoadedData={handleMediaLoad}
              onCanPlay={handleMediaLoad}
            />
          ) : null}
          
          {/* Overlay for hover effect */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-2xl" />
          
          {/* Video play indicator */}
          {item.video && (
            <div className="absolute top-4 right-4 bg-black/50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

const Page = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mediaLoading, setMediaLoading] = useState(true)
  const [shuffledMedia, setShuffledMedia] = useState<MediaItem[]>([])

  // Shuffle media data on component mount
  useEffect(() => {
    setShuffledMedia(shuffleArray(mediaData))
  }, [])

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setMediaLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Filter media based on search term using shuffled data
  const filteredMedia = useMemo<MediaItem[]>(() => {
    if (!searchTerm) return shuffledMedia
    
    const filtered = shuffledMedia.filter(item => 
      item.seoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.prompt.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    // Re-shuffle filtered results for variety
    return shuffleArray(filtered)
  }, [searchTerm, shuffledMedia])

  const handleSearch = (value: string) => {
    setIsLoading(true)
    setSearchTerm(value)
    setTimeout(() => setIsLoading(false), 300)
  }

  const getSkeletonHeights = () => {
    const heights = [250, 300, 350, 280, 320, 400, 380, 260, 420, 340]
    // Return deterministic order to avoid SSR/CSR hydration mismatch
    return Array.from({ length: 12 }, (_, i) => heights[i % heights.length])
  }

  // Function to re-shuffle media
  const reshuffleMedia = () => {
    setShuffledMedia(shuffleArray(mediaData))
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with search - KEEPING EXACTLY AS REQUESTED */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-black/50 rounded-b-xl"
      >
        <div className="max-w-7xl mx-auto p-3">
          {/* Centered search bar */}
          <motion.div 
            className="relative max-w-2xl mx-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500 w-5 h-5 z-10" />
            <Input
              type="text"
              placeholder="Search for poses"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 pr-4 py-3 w-full bg-zinc-900/50 border-zinc-800 rounded-2xl text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:bg-zinc-900/70 transition-all duration-300 backdrop-blur-sm"
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-zinc-600 border-t-transparent rounded-full"
                />
              </div>
            )}
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content - Pinterest Masonry Grid */}
      <main className="max-w-7xl mx-auto px-2 py-8">
        <AnimatePresence mode="wait">
          {mediaLoading ? (
            // Skeleton loading state with masonry layout
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="columns-2 md:columns-3 lg:columns-4 xl:columns-5  gap-4  space-y-0"
            >
              {getSkeletonHeights().map((height, index) => (
                <ImageSkeleton key={index} height={height} />
              ))}
            </motion.div>
          ) : filteredMedia.length === 0 ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="text-center py-20"
            >
              <div className=" mb-4 flex items-center justify-center">
              <Search className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-medium mb-2 text-zinc-300">No media found</h2>
              <p className="text-zinc-500">Try different search poses</p>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2 space-y-0"
            >
              {filteredMedia.map((item, index) => (
                <MediaCard
                  key={`${item.id}-${index}`}
                  item={item}
                  index={index}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default Page