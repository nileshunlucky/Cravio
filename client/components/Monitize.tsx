'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Eye } from 'lucide-react'

const Monitize = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.4 })
  const [userCount, setUserCount] = useState(100)

  // Sample video clips URLs - replace with your actual clip URLs
  const viralClips = [
    "https://v1.pinimg.com/videos/iht/expMp4/3c/b6/1f/3cb61f785a600f8e313124117a4cc4e0_720w.mp4",
    "https://v1.pinimg.com/videos/iht/720p/80/d2/cb/80d2cbb7d6ffb1f09fa27dc4a2bf1c3e.mp4",
    "https://v1.pinimg.com/videos/mc/720p/a9/2b/c7/a92bc743b3454df7d7892039a7eeb485.mp4",
    "https://v1.pinimg.com/videos/iht/720p/6d/b0/dd/6db0ddab56165dcee7a9f8038de7c5be.mp4",

  ]

  useEffect(() => {
    const fetchUserCount = async () => { 
      try {
        const res = await fetch(`https://cravio-ai.onrender.com/users-emails`)
        const data = await res.json()
        // Calculate total number of users from the email list
        const totalUsers = Array.isArray(data) ? data.length : 100
        setUserCount(totalUsers)
      } catch (error) {
        console.error('Error fetching user count:', error)
        setUserCount(100) // Fallback value
      } 
    }
      
    fetchUserCount()
  }, [])

 const VideoClip: React.FC<{ src: string; index: number }> = ({ src, index }) => {
  const [views, setViews] = useState<number | null>(null) // initially null
  const videoRef = useRef<HTMLVideoElement>(null)

  const formatViews = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
    return num.toString()
  }

  useEffect(() => {
    setViews(Math.floor(Math.random() * 950000) + 50000)

    if (videoRef.current) {
      videoRef.current.play().catch((error: unknown) => {
        console.log('Auto-play failed:', error)
      })
    }
  }, [])

    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.play().catch((error: unknown) => {
          console.log('Auto-play failed:', error)
        })
      }
    }, [])

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
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            style={{ aspectRatio: '9/16' }}
          />

          {/* Bottom Overlay with Stats */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <div className="flex items-center justify-between text-white text-sm">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                 <span>{views !== null ? formatViews(views) : '...'}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <section ref={ref} className="min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-black">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-6xl text-center space-y-8 sm:space-y-12 lg:space-y-16"
      >
        {/* Text Content */}
        <div className="space-y-4 sm:space-y-6">
          <motion.h2 
            className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="bg-[#c3002b] bg-clip-text text-transparent">
              {userCount}+ Creators
            </span>
            <br />
            <span className="text-white">Trust Mellvitta AI</span>
          </motion.h2>
          
          <motion.p 
            className="text-base md:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed px-4"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Our AI helps creators <br />
            <span className="bg-green-500 bg-clip-text text-transparent font-bold uppercase"> Go viral instantly</span> with professionally <br />
            edited content adding subtitles and captions.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 md:space-x-8 text-gray-400"
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
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-sm">Clips Created</div>
            </div>
            <div className="w-px h-12 bg-gray-600"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">98%</div>
              <div className="text-sm">Virality Score</div>
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
      </motion.div>
    </section>
  )
}

export default Monitize