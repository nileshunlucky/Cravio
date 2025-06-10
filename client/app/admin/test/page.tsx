'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useUser } from "@clerk/nextjs"
import { Play, Eye } from 'lucide-react'

const Monitize = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.4 })
  const { user } = useUser()
  const [users, setUsers] = useState([])

  // Sample video clips URLs - replace with your actual clip URLs
  const viralClips = [
    "/Video-769.mp4",
    "/Video-769.mp4",
    "/Video-769.mp4",
    "/Video-769.mp4",
    "/Video-769.mp4",
    "/Video-769.mp4",
    "/Video-769.mp4",
    "/Video-769.mp4",
  ]

  useEffect(() => {
    const fetchVideos = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return
      const email = user.primaryEmailAddress.emailAddress
  
      try {
        const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`)
        const data = await res.json()
        setUsers(data.email)
      } catch (error) {
        console.error('Error fetching videos:', error)
      } 
    }
      
    if (user) {
      fetchVideos()
    }
  }, [user])

  const VideoClip = ({ src, index }: { src: string; index: number }) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [views] = useState(Math.floor(Math.random() * 950000) + 50000) // Random views between 50k-1M
    const videoRef = useRef<HTMLVideoElement>(null)

    const togglePlay = () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause()
        } else {
          videoRef.current.play()
        }
        setIsPlaying(!isPlaying)
      }
    }

    const formatViews = (num : number) => {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M'
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K'
      }
      return num.toString()
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="relative flex-shrink-0 w-48 h-85 bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800"
      >
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            src={src}
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ aspectRatio: '9/16' }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          
          {/* Play/Pause Overlay */}
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            onClick={togglePlay}
          >
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-3">
              <Play className="w-8 h-8 text-white" fill="white" />
            </div>
          </div>

          {/* Bottom Overlay with Stats */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <div className="flex items-center justify-between text-white text-sm">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>{formatViews(views)}</span>
              </div>
              <div className="bg-red-500 px-2 py-1 rounded-full text-xs font-bold">
                VIRAL
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <section ref={ref} className="min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-6xl text-center space-y-16"
      >
        {/* Text Content */}
        <div className="space-y-6">
          <motion.h2 
            className="text-5xl md:text-7xl font-bold tracking-tight text-white"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {users.length > 0 ? `${users}+` : '100+'} Creators
            </span>
            <br />
            <span className="text-white">Trust Cravio AI</span>
          </motion.h2>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Transform long videos into viral short clips in seconds. Our AI-powered platform helps creators 
            <span className="text-yellow-400 font-semibold"> go viral instantly</span> with professionally 
            edited content that captures attention and drives engagement.
          </motion.p>
          
          <motion.div 
            className="flex items-center justify-center space-x-8 text-gray-400"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-white">10M+</div>
              <div className="text-sm">Views Generated</div>
            </div>
            <div className="w-px h-12 bg-gray-600"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">5 Sec</div>
              <div className="text-sm">Processing Time</div>
            </div>
            <div className="w-px h-12 bg-gray-600"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">98%</div>
              <div className="text-sm">Success Rate</div>
            </div>
          </motion.div>
        </div>

        {/* Viral Clips Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="w-full"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-8">
            See How Creators Are Going Viral
          </h3>
          
          {/* Scrolling Video Container */}
          <div className="relative overflow-hidden">
            <motion.div
              animate={{
                x: [0, -100 * (viralClips.length / 2)]
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 20,
                  ease: "linear",
                },
              }}
              className="flex space-x-6"
              style={{ width: `${viralClips.length * 200}px` }}
            >
              {viralClips.concat(viralClips).map((clip, index) => (
                <VideoClip key={index} src={clip} index={index} />
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="pt-8"
        >
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl">
            Start Creating Viral Content
          </button>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default Monitize