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
    seoName: "brunette-model-sensual-outdoor-rock-portrait",
    image: "https://i.pinimg.com/736x/18/f3/b0/18f3b06fe506fc2c821435f746d8967f.jpg",
    prompt: "Ultra-realistic portrait of a brunette woman sitting on rocks outdoors, wearing a beige long-sleeve ribbed crop top with deep neckline and matching short skirt, playful and sensual pose with one hand near her lips, straight long dark hair flowing naturally, subtle makeup with highlighted eyes and soft lips, delicate jewelry including a choker necklace and pendant, natural background with greenery and rocky textures, golden hour natural lighting, cinematic outdoor fashion photography, sharp details, 8K resolution, high-end editorial aesthetic"
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
    seoName: "fit-brunette-model-yoga-pose-sunlit-room",
    image: "https://i.pinimg.com/736x/a8/38/d4/a838d4cf05be3339e791b2404f7fc000.jpg",
    prompt: "Ultra-realistic portrait of a brunette woman doing yoga indoors, leaning forward on her arms in a stretching pose, wearing a light purple sports bra and matching high-waisted leggings, slim fit body, long straight brown hair falling to the side, natural makeup with soft features, sunlight streaming through a window casting bright highlights and shadows on her body and the floor, minimal indoor background with white walls and tiled flooring, cinematic lifestyle photography, high detail, 8K resolution, natural warm lighting"
  },
  {
    id: 5,
    seoName: "blonde-model-pink-gymwear-mirror-selfie",
    image: "https://i.pinimg.com/736x/8a/19/35/8a1935ae4d4003632dcfd1a50ad1e511.jpg",
    prompt: "Ultra-realistic portrait of a blonde woman taking a mirror selfie indoors, sitting on the wooden floor in a kneeling pose, wearing a matching pink sports bra and high-waisted leggings, slim fit curvy body, long straight blonde hair, natural soft makeup, holding smartphone in her right hand with visible reflection, modern apartment interior with dark green sofa, curtains, glass balcony doors and city view in the background, bright daylight natural lighting, cinematic lifestyle fitness photography, sharp details, 8K resolution, luxury aesthetic"
  },
  {
    id: 6,
    seoName: "long-haired-blonde-model-bedroom-portrait",
    image: "https://i.pinimg.com/736x/70/b4/45/70b4452d7015c08e2a7bd0fde033b105.jpg",
    prompt: "Ultra-realistic portrait of a young blonde woman with very long straight hair, sitting on the floor in a bedroom, wearing an oversized white shirt with lace stockings partially visible, soft sensual pose leaning slightly to the side, natural subtle makeup with gentle expression, cozy modern interior with a bed, sofa, plush toy, and a large wall poster featuring sports cars and city background, warm natural daylight illuminating the room, cinematic lifestyle photography, high detail, 8K resolution, professional editorial aesthetic"
  },
  {
    id: 7,
    seoName: "blonde-bikini-model-sunlit-outdoor-portrait",
    image: "https://i.pinimg.com/736x/b1/89/dd/b189ddc321c4e3af51b2e7af874feb84.jpg",
    prompt: "Ultra-realistic photo of a young blonde woman in a black bikini, sitting outdoors on a lounge chair, soft sunlight illuminating her body, playful sensual pose with closed eyes and a gentle smile, toned figure with a belly button piercing and delicate necklace, natural summer vibes, stone patio background with greenery, lifestyle fashion photography, cinematic warm tones, high detail, 8K resolution, professional editorial aesthetic"
  },
  {
    id: 8,
    seoName: "brunette-bikini-model-luxury-sports-car-summer-shoot",
    image: "https://i.pinimg.com/736x/fd/e5/73/fde573b738733bad38df997e20347b87.jpg",
    prompt: "Ultra-realistic editorial photo of a stunning brunette woman in a black bikini, leaning against a glossy pink luxury sports car under bright summer sunlight, confident and glamorous pose, toned body with natural curves, long wavy hair flowing, stylish high-end vibe, upscale outdoor location with stone driveway and villa wall, cinematic golden hour lighting, professional fashion and lifestyle photography, 8K resolution"
  },
  {
    id: 9,
    seoName: "tattooed-brunette-model-selfie-white-dress-bedroom-aesthetic",
    image: "https://i.pinimg.com/736x/fd/d9/b0/fdd9b098c48bde9a05fa94e1d66ae772.jpg",
    prompt: "Ultra-realistic portrait of a tattooed brunette woman taking a mirror selfie, sitting elegantly on a bed with floral sheets, wearing a short white dress with ribbon straps, playful sensual pose with finger on lips, long flowing hair, visible tattoos on arms and legs, accessorized with earrings and necklace, modern feminine bedroom with natural daylight, lifestyle fashion photography, high detail, cinematic tones, 8K resolution"
  },
  {
    id: 10,
    seoName: "brunette-bikini-mirror-selfie-bathroom-intimate-pose",
    image: "https://i.pinimg.com/736x/86/31/4d/86314d1e063b382bd959b2b6bcef52fe.jpg",
    prompt: "Ultra-realistic portrait of a brunette woman with long wavy dark hair taking a mirror selfie in a modern bathroom, wearing a light blue/gray triangle bikini top and matching high-cut bikini bottoms, confident intimate pose with one hand holding phone, curvy feminine figure, flawless skin, standing in front of bathroom mirror with shower door visible in background, neutral bathroom tiles and modern fixtures, soft indoor lighting, lifestyle photography aesthetic, high detail, professional quality, 8K resolution"
  },
  {
    id: 11,
    seoName: "blonde-model-tan-trench-coat-platform-heels-studio-fashion",
    image: "https://i.pinimg.com/1200x/90/eb/15/90eb15e328f612d8bd781726dae80bf3.jpg",
    prompt: "Ultra-realistic portrait of a blonde woman with long wavy hair in a professional studio photoshoot, wearing an oversized tan/beige trench coat styled as a dress worn off-shoulder, black platform high heels with ankle straps, elegant confident pose looking over shoulder, flawless skin and makeup, sitting pose with legs crossed, clean white studio background, high-fashion editorial photography style, professional lighting, glamorous feminine aesthetic, high detail, commercial photography quality, 8kresolution"
  },
  {
    id: 12,
    seoName: "brunette-black-bodysuit-crouching-pose-high-heels-studio",
    image: "https://i.pinimg.com/1200x/59/9c/96/599c96a5a4a566971cafab2f6a9fed81.jpg",
    prompt: "Ultra-realistic portrait of a brunette woman with long wavy layered hair in a professional studio photoshoot, wearing a black long-sleeved bodysuit with cutout details, crouching pose with confident expression looking over shoulder, black strappy high heel sandals with ankle straps, athletic feminine figure, flawless skin and natural makeup, dramatic studio lighting against neutral beige background, modern fashion photography style, sophisticated sensual aesthetic, high detail, commercial photography quality, 8K resolution"
  },
  {
    id: 13,
    seoName: "blonde-bikini-hot-tub-bubble-dome-glamping-outdoor-luxury",
    image: "https://i.pinimg.com/736x/bb/60/48/bb60489cad6ce3da212f4aba3e5f03ac.jpg",
    prompt: "Ultra-realistic portrait of a blonde woman with long straight hair in a luxury outdoor hot tub spa setting, wearing a navy blue bikini with white string ties, sitting in bubbling hot tub water, looking over shoulder with bright smile, golden hour lighting with warm sunlight, transparent bubble dome glamping tent in background, autumn trees with yellow foliage, luxury outdoor resort atmosphere, natural outdoor lighting, lifestyle travel photography, high detail, premium vacation aesthetic, 8K resolution"
  },
  {
    id: 14,
    seoName: "brunette-gray-sweater-cozy-couch-living-room-casual-intimate",
    image: "https://i.pinimg.com/736x/fd/31/4c/fd314c7f38413ed0fdcffa356938ff85.jpg",
    prompt: "Ultra-realistic portrait of a brunette woman with long layered hair sitting on a beige sectional couch, wearing an oversized gray off-shoulder sweater, white ankle socks, relaxed intimate pose with hand in hair, cozy modern living room setting with neutral beige throw blanket with fringe details, William Morris botanical art prints on white wall, natural indoor lighting, casual lifestyle photography, comfortable home aesthetic, intimate feminine mood, high detail, candid photography style, 8K resolution"
  },
  {
    id: 15,
    seoName: "blonde-bikini-cooking-kitchen-luxury-home-domestic-lifestyle",
    image: "https://i.pinimg.com/736x/77/65/83/776583ede4b82090d709e421e68d3fef.jpg",
    prompt: "Ultra-realistic portrait of a blonde woman with long wavy hair cooking in a luxury modern kitchen, wearing a black triangle bikini top and matching bottoms, visible thigh tattoo with text, cooking vegetables in a stainless steel pan on gas stovetop, confident domestic pose, upscale white kitchen with coffered blue ceiling, white cabinetry and marble countertops, large windows with natural daylight, stainless steel appliances, lifestyle photography aesthetic, modern luxury home interior, casual domestic scene, high detail, professional photography quality, 8K resolution"
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