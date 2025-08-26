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
    seoName: "sunlit-fashion-model-linen-suit-sensual-portrait",
    image: "https://i.pinimg.com/1200x/08/e3/79/08e3793a53904f3acb5ed917280795dd.jpg",
    prompt: "Ultra-realistic portrait of a stylish woman standing by a window, golden hour sunlight casting dramatic shadows, wearing an oversized beige linen suit jacket and matching trousers with hands in pockets, jacket open in a sensual and elegant manner, long wavy brown hair, glossy lips, wearing round sunglasses, tropical greenery visible in the background, cinematic editorial photography, luxury aesthetic, professional high-end fashion shot, 8K resolution, sharp details, warm natural tones"
  },
  {
    id: 2,
    seoName: "blonde-model-sexy-swimsuit-poolside-portrait",
    image: "https://i.pinimg.com/1200x/6c/4b/e8/6c4be8ca9bc0b90185d6e081940a169b.jpg",
    prompt: "Ultra-realistic portrait of a blonde woman at a swimming pool, sitting on the pool edge with both hands resting on the ledge, wearing a revealing beige one-piece swimsuit with deep cut design, long wavy blonde hair, tanned smooth skin, natural makeup with glossy lips, bright daylight, clear blue water reflecting sunlight, green trees and wooden fence in background, cinematic luxury vacation aesthetic, professional high-end fashion photography, sharp details, 8K resolution, natural lighting"
  },
  {
    id: 3,
    seoName: "cute-brunette-model-playful-outdoor-portrait",
    image: "https://i.pinimg.com/736x/ae/45/80/ae458008232fa4c6196b8f169f71d1e1.jpg",
    prompt: "Ultra-realistic portrait of a playful brunette woman outdoors, sticking out her tongue and looking upwards with a fun expression, wearing a tight green crop top and light gray shorts, layered gold necklaces around her neck, natural makeup with flushed cheeks, long tied-back hair with loose strands, background showing wooden deck, green grass, bushes, and a calm lake with blue sky and clouds, daylight natural lighting, cinematic outdoor vibe, sharp details, professional high-quality photography, 8K resolution"
  },
  {
    id: 4,
    seoName: "cyberpunk-neon-character-futuristic-style",
    image: "https://images.unsplash.com/photo-1596815064285-45ed8a9c0463?w=280",
    prompt: "Cyberpunk character portrait, neon lighting effects, futuristic cityscape background, holographic elements, sci-fi aesthetic, digital art style"
  },
  {
    id: 5,
    seoName: "professional-business-portrait-corporate-headshot",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=320",
    prompt: "Corporate business portrait, professional headshot, clean background, confident expression, executive style, commercial photography"
  },
  {
    id: 6,
    seoName: "fantasy-magical-character-ethereal-portrait",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=380",
    prompt: "Fantasy character portrait, magical ethereal lighting, mystical atmosphere, enchanted forest background, fantasy art style, dreamy aesthetic"
  },
  {
    id: 7,
    seoName: "street-style-urban-fashion-editorial-shoot",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=340",
    prompt: "Urban street style fashion, editorial photography, city background, trendy outfit, natural lighting, contemporary fashion shoot"
  },
  {
    id: 8,
    seoName: "vintage-retro-fashion-model-classic-style",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=290",
    prompt: "Vintage fashion model, retro styling, classic Hollywood glamour, warm film tones, timeless elegance, vintage photography aesthetic"
  },
  {
    id: 10,
    seoName: "bohemian-natural-beauty-outdoor-portrait",
    image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=310",
    prompt: "Bohemian natural beauty, outdoor portrait, golden hour lighting, flowing hair, earth tones, organic aesthetic, lifestyle photography"
  },
  {
    id: 11,
    seoName: "gothic-dark-aesthetic-dramatic-portrait",
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=330",
    prompt: "Gothic dark aesthetic, dramatic portrait lighting, mysterious atmosphere, dark fashion, intense expression, artistic photography"
  }
]

// Skeleton component
const ImageSkeleton = ({ height }: { height: number }) => (
  <div className="break-inside-avoid mb-4">
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

  const handleImageLoad = (_e: React.SyntheticEvent<HTMLImageElement>) => {
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
      className="break-inside-avoid mb-4 group cursor-pointer"
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
      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {imagesLoading ? (
            // Skeleton loading state with masonry layout
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-0"
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
              className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-0"
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