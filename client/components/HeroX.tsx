"use client"

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'

type ImageItem = {
  id: number
  seoName: string
  image: string
  prompt: string
}

// Mock AI image data with prompts
const imageData: ImageItem[] = [
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
]

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

const ImageCard = ({ item, index }: { item: ImageItem; index: number }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(cardRef, { once: true, margin: "100px" })
  const router = useRouter()

  const getRandomHeight = () => {
    const heights = [250, 300, 350, 280, 320, 400, 380, 260, 420, 340]
    return heights[item.id % heights.length]
  }

 // With this:
const handleImageLoad = () => {
  setImageLoaded(true)
}

  const handleImageClick = () => {
    // Encode the prompt and image URL for the URL parameters
    const encodedPrompt = encodeURIComponent(item.prompt)
    const encodedImage = encodeURIComponent(item.image)
    
    // Redirect to canvas page with the prompt and reference image
    router.push(`/admin/canvas?prompt=${encodedPrompt}&referenceImage=${encodedImage}`)
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
      onClick={handleImageClick} // Add the click handler here
    >
      <div className="relative bg-zinc-900/20 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
        <div className="relative overflow-hidden rounded-2xl">
          {!imageLoaded && (
            <div 
              className="absolute inset-0 bg-zinc-800 animate-pulse rounded-2xl" 
              style={{ height: `${getRandomHeight()}px` }} 
            />
          )}
          <img
            src={item.image}
            alt={item.seoName}
            className={`w-full object-cover transition-all duration-500 rounded-2xl ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ 
              height: imageLoaded ? 'auto' : `${getRandomHeight()}px`,
              minHeight: '200px',
              maxHeight: '500px'
            }}
            loading="lazy"
            onLoad={handleImageLoad}
          />
          
          {/* Overlay for hover effect */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-2xl" />
         
        </div>
      </div>
    </motion.div>
  )
}

const Page = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [imagesLoading, setImagesLoading] = useState(true)

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setImagesLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Filter images based on search term
  const filteredImages = useMemo<ImageItem[]>(() => {
    if (!searchTerm) return imageData
    
    return imageData.filter(item => 
      item.seoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.prompt.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm])

  const handleSearch = (value: string) => {
    setIsLoading(true)
    setSearchTerm(value)
    setTimeout(() => setIsLoading(false), 300)
  }

  const getSkeletonHeights = () => {
    const heights = [250, 300, 350, 280, 320, 400, 380, 260, 420, 340]
    return Array.from({ length: 12 }, (_, i) => heights[i % heights.length])
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
              placeholder="Search poses"
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
          {imagesLoading ? (
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
          ) : filteredImages.length === 0 ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="text-center py-20"
            >
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-medium mb-2 text-zinc-300">No images found</h2>
              <p className="text-zinc-500">Try different search terms</p>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2 space-y-0"
            >
              {filteredImages.map((item, index) => (
                <ImageCard
                  key={item.id}
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