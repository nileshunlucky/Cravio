'use client'

import React, { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Heart, Share2, Download, User, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Mock AI influencer data with SEO-optimized names
const influencerData = [
  {
    id: 1,
    name: "sophia-ai-model-luxury-fashion-2024",
    title: "Luxury Fashion AI Model Sophia",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
    creator: "AI Studio Pro",
    likes: 1245,
    views: 8932,
    tags: ["fashion", "luxury", "ai-model", "portrait"]
  },
  {
    id: 2,
    name: "emma-virtual-influencer-beauty-skincare",
    title: "Virtual Beauty Influencer Emma",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300",
    creator: "Digital Faces",
    likes: 892,
    views: 5234,
    tags: ["beauty", "skincare", "virtual", "influencer"]
  },
  {
    id: 3,
    name: "alex-ai-fitness-model-workout-inspiration",
    title: "AI Fitness Model Alex Workout",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=350",
    creator: "Fit AI Studio",
    likes: 2134,
    views: 12543,
    tags: ["fitness", "workout", "ai-model", "inspiration"]
  },
  {
    id: 4,
    name: "luna-cyberpunk-ai-character-neon-style",
    title: "Cyberpunk AI Character Luna",
    image: "https://images.unsplash.com/photo-1596815064285-45ed8a9c0463?w=280",
    creator: "Cyber Dreams",
    likes: 3421,
    views: 18765,
    tags: ["cyberpunk", "neon", "ai-character", "futuristic"]
  },
  {
    id: 5,
    name: "maya-professional-ai-model-business-portrait",
    title: "Professional AI Model Maya",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=320",
    creator: "Corporate AI",
    likes: 756,
    views: 4321,
    tags: ["professional", "business", "portrait", "corporate"]
  },
  {
    id: 6,
    name: "zara-fantasy-ai-character-magical-portrait",
    title: "Fantasy AI Character Zara",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=380",
    creator: "Fantasy Studio",
    likes: 1876,
    views: 9876,
    tags: ["fantasy", "magical", "ai-character", "portrait"]
  },
  {
    id: 7,
    name: "kai-street-style-ai-influencer-urban-fashion",
    title: "Street Style AI Influencer Kai",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=340",
    creator: "Urban AI",
    likes: 1543,
    views: 7654,
    tags: ["street-style", "urban", "fashion", "influencer"]
  },
  {
    id: 8,
    name: "aria-vintage-ai-model-retro-fashion-style",
    title: "Vintage AI Model Aria Retro",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=290",
    creator: "Retro Digital",
    likes: 987,
    views: 5432,
    tags: ["vintage", "retro", "fashion", "ai-model"]
  },
  {
    id: 9,
    name: "nova-futuristic-ai-character-sci-fi-portrait",
    title: "Futuristic AI Character Nova",
    image: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=360",
    creator: "Sci-Fi Studio",
    likes: 2876,
    views: 15234,
    tags: ["futuristic", "sci-fi", "ai-character", "portrait"]
  },
  {
    id: 10,
    name: "isla-bohemian-ai-influencer-natural-beauty",
    title: "Bohemian AI Influencer Isla",
    image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=310",
    creator: "Boho AI",
    likes: 1234,
    views: 6789,
    tags: ["bohemian", "natural", "beauty", "influencer"]
  },
  {
    id: 11,
    name: "phoenix-gothic-ai-model-dark-aesthetic",
    title: "Gothic AI Model Phoenix Dark",
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=330",
    creator: "Dark Arts AI",
    likes: 1654,
    views: 8765,
    tags: ["gothic", "dark", "aesthetic", "ai-model"]
  },
  {
    id: 12,
    name: "sage-minimalist-ai-character-clean-portrait",
    title: "Minimalist AI Character Sage",
    image: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=370",
    creator: "Minimal Studio",
    likes: 876,
    views: 4567,
    tags: ["minimalist", "clean", "portrait", "ai-character"]
  }
]

const Page = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [likedImages, setLikedImages] = useState(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const gridRef = useRef(null)

  // Filter images based on search term (matches image names and tags)
  const filteredImages = useMemo(() => {
    if (!searchTerm) return influencerData
    
    return influencerData.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.creator.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm])

  const handleLike = (id) => {
    setLikedImages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleSearch = (value) => {
    setIsLoading(true)
    setSearchTerm(value)
    setTimeout(() => setIsLoading(false), 300)
  }

  // Masonry grid item heights for Pinterest-style layout
  const getRandomHeight = (index) => {
    const heights = [250, 300, 350, 280, 320, 290]
    return heights[index % heights.length]
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 ">
        <div className="absolute inset-0 bg-gradient-to-r from-[#B08D57]/20 via-transparent to-[#B08D57]/20"></div>
      </div>
      
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="sticky top-0 z-50 backdrop-blur-md "
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          
          {/* Search Bar */}
          <motion.div 
            className="relative max-w-2xl mx-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search AI influencers, styles, or creators..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 pr-4 py-3 w-full border-zinc-600 rounded-2xl text-white placeholder:text-zinc-400 focus:border-[#B08D57] focus:ring-[#B08D57]/20 transition-all duration-300"
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-[#B08D57] border-t-transparent rounded-full"
                />
              </div>
            )}
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {filteredImages.length === 0 ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="text-center py-20"
            >
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-semibold mb-2 text-zinc-300">No AI influencers found</h2>
              <p className="text-zinc-400">Try adjusting your search terms</p>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              ref={gridRef}
              className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-6 space-y-6"
            >
              {filteredImages.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="break-inside-avoid mb-6 group cursor-pointer"
                  onClick={() => setSelectedImage(item)}
                >
                  <div className="relative bg-zinc-800/30 rounded-2xl overflow-hidden backdrop-blur-sm border border-zinc-700/30 hover:border-[#B08D57]/50 transition-all duration-300">
                    <div className="relative overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        title={item.name} // SEO-optimized title attribute
                        className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-500"
                        style={{ height: `${getRandomHeight(index)}px` }}
                        loading="lazy"
                      />
                      
                      {/* Overlay on hover */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-4"
                      >
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-zinc-300 text-xs opacity-80">
                            by {item.creator}
                          </p>
                        </div>
                      </motion.div>

                      {/* Action buttons */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileHover={{ opacity: 1, y: 0 }}
                        className="absolute top-4 right-4 flex gap-2"
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-8 w-8 p-0 rounded-full backdrop-blur-sm transition-all duration-300 ${
                            likedImages.has(item.id) 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'bg-white/20 hover:bg-white/30 text-white'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLike(item.id)
                          }}
                        >
                          <Heart className={`w-4 h-4 ${likedImages.has(item.id) ? 'fill-current' : ''}`} />
                        </Button>
                      </motion.div>
                    </div>
                    
                    {/* Stats bar */}
                    <div className="p-4">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {item.likes.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {item.views.toLocaleString()}
                          </span>
                        </div>
                        <User className="w-3 h-3" />
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 text-xs bg-[#B08D57]/20 text-[#B08D57] rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modal for selected image */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-zinc-900 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-zinc-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <img
                  src={selectedImage.image}
                  alt={selectedImage.title}
                  title={selectedImage.name} // SEO-optimized title
                  className="w-full h-auto max-h-[60vh] object-cover"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setSelectedImage(null)}
                >
                  ×
                </Button>
              </div>
              
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {selectedImage.title}
                </h2>
                <p className="text-zinc-400 mb-4">Created by {selectedImage.creator}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-4">
                    <span className="flex items-center gap-2 text-zinc-300">
                      <Heart className="w-4 h-4" />
                      {selectedImage.likes.toLocaleString()} likes
                    </span>
                    <span className="flex items-center gap-2 text-zinc-300">
                      <Eye className="w-4 h-4" />
                      {selectedImage.views.toLocaleString()} views
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-[#B08D57] hover:bg-[#9A7B4F] text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {selectedImage.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm bg-[#B08D57]/20 text-[#B08D57] rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                
                {/* SEO optimized filename display */}
                <div className="mt-4 p-3  rounded-lg">
                  <p className="text-xs text-zinc-400 mb-1">SEO Filename:</p>
                  <code className="text-sm text-[#B08D57] break-all">
                    {selectedImage.name}.jpg
                  </code>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Page