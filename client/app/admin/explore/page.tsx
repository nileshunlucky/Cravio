"use client"

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Search, Copy, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Mock AI image data with prompts
const imageData = [
  {
    id: 1,
    seoName: "luxury-fashion-model-golden-hour-portrait",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
    prompt: "Professional fashion model portrait, golden hour lighting, luxury background, high-end commercial photography, ultra realistic, 8K resolution"
  },
  {
    id: 2,
    seoName: "virtual-beauty-influencer-minimalist-studio",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300",
    prompt: "Beautiful virtual influencer, clean minimalist studio lighting, soft shadows, natural beauty, photorealistic render, professional headshot"
  },
  {
    id: 3,
    seoName: "fitness-model-workout-motivation-aesthetic",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=350",
    prompt: "Athletic fitness model, dynamic workout pose, motivational aesthetic, gym environment, dramatic lighting, high contrast, fitness photography"
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
    id: 9,
    seoName: "futuristic-sci-fi-character-space-age",
    image: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=360",
    prompt: "Futuristic sci-fi character, space age costume, metallic textures, cosmic background, advanced technology elements, digital art rendering"
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
  },
  {
    id: 12,
    seoName: "minimalist-clean-portrait-modern-style",
    image: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=370",
    prompt: "Minimalist clean portrait, modern styling, neutral background, soft lighting, contemporary aesthetic, professional photography"
  }
]

type ImageData = {
  id: number
  seoName: string
  image: string
  prompt: string
}

// Skeleton component
const ImageSkeleton = () => (
  <div className="mb-4">
    <div className="bg-zinc-900/50 rounded-xl overflow-hidden">
      <div className="animate-pulse">
        <div className="bg-zinc-800 h-64 w-full rounded-xl"></div>
      </div>
    </div>
  </div>
)

const ImageCard = ({ item, index }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const cardRef = useRef(null)
  const isInView = useInView(cardRef, { once: true, margin: "100px" })

  const copyPrompt = async (prompt, id) => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const getRandomHeight = () => {
    const heights = [240, 280, 320, 260, 300, 340, 360, 200, 380]
    return heights[item.id % heights.length]
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
      className="mb-4 group cursor-pointer"
    >
      <div className="relative bg-zinc-900/30 rounded-xl overflow-hidden backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
        <div className="relative overflow-hidden rounded-xl">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-zinc-800 animate-pulse" style={{ height: `${getRandomHeight()}px` }} />
          )}
          <img
            src={item.image}
            alt={item.seoName}
            className={`w-full h-auto object-cover transition-all duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ height: `${getRandomHeight()}px` }}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
          
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
  const filteredImages = useMemo(() => {
    if (!searchTerm) return imageData
    
    return imageData.filter(item => 
      item.seoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.prompt.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm])

  const handleSearch = (value) => {
    setIsLoading(true)
    setSearchTerm(value)
    setTimeout(() => setIsLoading(false), 300)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with search */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-black/50 border-b border-zinc-800"
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
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
              placeholder="Search by name or description..."
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

      {/* Main Content - Pinterest Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {imagesLoading ? (
            // Skeleton loading state
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {Array.from({ length: 12 }).map((_, index) => (
                <ImageSkeleton key={index} />
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
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
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