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
  img?: string
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
    img: "https://res.cloudinary.com/dxpydoteo/image/upload/v1758271862/2a1e4f9b-0356-4210-8286-c5ac60d2a08f.png",
    video: "https://res.cloudinary.com/dxpydoteo/video/upload/v1758266840/image_pe3wl2.mp4",
    prompt: "A young woman in a translucent white raincoat stands on a long pier extending into the ocean, her wet hair swept by the wind. The sky is stormy and dramatic, with dark clouds over the horizon and the sea beneath her. Her gaze is calm yet intense as she looks directly into the camera. The camera begins close-up, centered on her face and hood, capturing the moody ambiance of the scene. Suddenly, the camera begins a fast and seamless zoom-out. She remains completely motionless as the view pulls back—past the pier, above the sea, over the coastline, and then rapidly ascends through the cloudy sky. The scene transitions through the atmosphere into outer space, revealing a clean, photorealistic Earth slowly rotating in the darkness. No overlays or extra effects — just a single glowing dot marking her original position on the planet."
  },
  {
    id: 6,
    seoName: "men-looking-at-outfit-showcase-closeup",
    img: "https://res.cloudinary.com/dxpydoteo/image/upload/v1758271870/1bd19304-6a77-463d-b6dc-82b911095199.png",
    video: "https://res.cloudinary.com/dxpydoteo/video/upload/v1758270304/image-1_yncxqi.mp4",
    prompt: "A stylish creator outfit showcase video, starting with a close-up front shot smiling confidently, then smoothly transitioning to a back view highlighting the outfit’s fit and details, filmed in clean lighting with natural movement for a trendy, premium fashion look."
  },
  {
    id: 7,
    seoName: "model-sitting-on-chair-spinning-rotating",
    img: "https://res.cloudinary.com/dxpydoteo/image/upload/v1758273292/Screenshot_2025-09-19-14-43-49-42_99c04817c0de5652397fc8b56c3b3817_qovsa8.jpg",
    video: "https://res.cloudinary.com/dxpydoteo/video/upload/v1758273093/3d_rotate_w94y8x.mp4",
    prompt: "The model sits on a simple, vintage office chair in the center of the frame, wearing a black leather jacket, oversized leather pants, and sneakers. The camera remains completely still, capturing him as he slowly rotates around his own axis while sitting. His posture is relaxed yet confident, with his arms resting loosely at his sides. As he spins, the soft shine of the leather pants and jacket catches the light, emphasizing the smooth texture and the contrasts in the shadows. The background is minimalistic, with pure white walls that highlight the sharp edges and clean lines of the model's outfit. The lighting is soft yet dramatic, casting deep shadows that emphasize the contours of his body and the folds of his clothing. The motion is subtle but mesmerizing, with the slow, controlled rotation adding an almost hypnotic quality to the scene. The overall mood is sleek, modern, and cinematic, with a focus on the fluidity of the rotation and the bold simplicity of the look."
  },
  {
    id: 8,
    seoName: "model-shot-red-ferrari-car-cinematic",
    img: "https://res.cloudinary.com/dxpydoteo/image/upload/v1758274034/Screenshot_2025-09-19-14-56-21-00_99c04817c0de5652397fc8b56c3b3817_wzbed3.jpg",
    video: "https://res.cloudinary.com/dxpydoteo/video/upload/v1758273774/red_ferrari_r2ed3g.mp4",
    prompt: "Start with a low-angle shot behind Model, silhouetted against dim overhead lights in a dark warehouse. He begins walking confidently toward a sleek red ferrari parked in front of a large garage door. The camera starts at ground level behind him, then performs a slow, dramatic crane up, rising smoothly to reveal more of the car and the massive space around him. Moody lighting creates sharp reflections on the polished floor. The scene should feel cinematic, intense, and powerful — like the buildup before a major event.ohwx tchnq"
  },
  {
    id: 9,
    seoName: "fashion-model-metro-train-cinematic-aesthetic",
    img: "https://res.cloudinary.com/dxpydoteo/image/upload/v1758275171/unnamed_y6cxdv.png",
    video: "https://res.cloudinary.com/dxpydoteo/video/upload/v1758275177/qi98LuQGJhV43dmnz7Lt4_output_hbce7d.mp4",
    prompt: "A cinematic Apple-style fashion video captures a male model in sleek all-black attire standing confidently before the camera (looking at camera) as his hair flows in a gentle breeze, while a modern metro train glides past in the blurred background, filmed in ultra-sharp 4K with smooth gimbal motion, soft natural daylight mixed with subtle rim lighting, shallow depth of field, and refined color grading to emphasize the minimalist urban aesthetic and the dramatic movement of both hair and passing train. (night scene, aesthetic)"
  },
  {
    id: 10,
    seoName: "woman-model-at-runway-showcase-cat-walk",
    img: "https://i.pinimg.com/1200x/25/d1/5e/25d15e68233504703e862fc6009f7b88.jpg",
    video: "https://res.cloudinary.com/dxpydoteo/video/upload/v1758276438/output_mopo1g.mp4",
    prompt: "A striking, high-fashion showcase follows an elegant Russian model in a luxurious deep-crimson dragon-inspired gown and coordinating designer bag—evoking a futuristic Coachella-style statement—as she performs a confident catwalk at a Zara runway show, the camera gliding in ultra-sharp 4K with smooth gimbal motion and shallow depth of field, dramatic low-key lighting carving soft highlights across the shimmering fabric, muted dark background and minimal set design amplifying her every step, while refined color grading and subtle lens flares create the polished, premium atmosphere of an Apple product film."
  },
  {
    id: 11,
    seoName: "young-women-stands-walk-street-nails",
    image: "https://res.cloudinary.com/dxpydoteo/image/upload/v1758277831/740064f6-4604-411e-9644-0e47c845f1fe.png",
    prompt: "A young woman stands on a sidewalk outside a building with large windows behind her. She is wearing a light blue-green zip-up jacket, a black skirt, and teal shoes. The photograph prominently features her hands with colorful, detailed nail art in bright orange, teal, dark blue, and silver shades, which are extended toward the camera in the foreground, creating a dramatic close-up effect. The image is captured in natural daylight, revealing clear shadows on the pavement and casting an even, bright illumination across the scene. The camera angle is a high-angle shot, looking down slightly on the woman, and the depth of field places emphasis on her hands with the background softly blurred. The photograph has sharp clarity and shows a dynamic perspective with vibrant, contrasting colors."
  },
  {
    id: 12,
    seoName: "flash-waves-oceans-seo-beach-night-dark",
    image: "https://res.cloudinary.com/dxpydoteo/image/upload/v1758278084/e12f1142-48a3-4a16-8b30-1a0eed35da65.png",
    prompt: "A sudden flash reveals her serene figure framed by softly undulating waves and dark sand, one hand tucked casually into the pocket of a flowing deep brown satin dress that ripples gently in the seaside breeze. The faint shimmer of her skin and damp tendrils of hair catch the subtle moon-glimmers while expansive night envelops two-thirds of the frame in velvety darkness. Her poised stance stands crisply against the blurred swirl of the hem, a quiet magnetism rising from the interplay of fluid fabric and natural textures, inviting calm admiration beneath the soft glow of distant ambient light. —flash-lit elegant beach snapshot, captured on iPhone."
  },
  {
    id: 13,
    seoName: "man-stands-urban-pavement-historic-stone-sneakers",
    image: "https://res.cloudinary.com/dxpydoteo/image/upload/v1758278737/d4f9ca8a-2c75-4595-9900-517d9ecbc042.png",
    prompt: "A young man stands on a patterned urban pavement in front of a historic stone building with columns and windows. He wears a light beige open-front textured shirt over a white t-shirt, paired with wide-leg dark olive green pants and white sneakers. A cream-colored crossbody bag is slung over his shoulder, and he has a watch on his left wrist. Behind him and blocking part of the view is an enormous close-up of a white sneaker with a black stitched star detail, creating a surreal visual scale difference. The image is sharp and high definition, captured at eye level with natural daylight emphasizing the architectural and fashion details. The composition uses a wide shot and an artistic juxtaposition of normal-sized and oversized objects to create visual interest."
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
        const preview = item.img ?? item.image ?? ''
        const encodedVideoImg = encodeURIComponent(preview)
        router.push(`/admin/opus?prompt=${encodedPrompt}${preview ? `&referenceImage=${encodedVideoImg}` : ''}`)
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