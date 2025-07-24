"use client"

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { Send , Link, ArrowDownToLine } from 'lucide-react'

interface Post {
  post_url: string
  caption: string
  created_at: string
}

const Page = () => {
  const { user } = useUser()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)


  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.emailAddresses?.[0]?.emailAddress) {

        return
      }

      const email = user.emailAddresses[0].emailAddress

      try {
        const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`)
        const data = await res.json()

        if (res.ok) {
          setPosts(data.posts)
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error)
        setPosts([]) // Fallback to mock data
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return `${Math.ceil(diffDays / 30)} months ago`
  }

  const getGridItemClass = (index: number) => {
    // Instagram-like grid pattern
    if (index % 6 === 0) return "row-span-2 col-span-2" // Large square
    if (index % 6 === 1 || index % 6 === 2) return "row-span-1 col-span-1" // Small squares
    if (index % 6 === 3) return "row-span-2 col-span-1" // Tall rectangle
    if (index % 6 === 4 || index % 6 === 5) return "row-span-1 col-span-1" // Small squares
    return "row-span-1 col-span-1"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#4e3c20] via-[#B08D57] to-[#4e3c20] p-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-3 gap-1 auto-rows-[200px]">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className={`${getGridItemClass(i)} bg-black/20`} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4e3c20] via-[#B08D57] to-[#4e3c20]">

      {/* Grid */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-3 gap-1 auto-rows-[200px]">
          {posts.map((post, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`${getGridItemClass(index)} relative group cursor-pointer overflow-hidden rounded-sm`}
              onClick={() => setSelectedPost(post)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <img
                src={post.post_url}
                alt={post.caption}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                
              </div>

              {/* Corner gradient */}
              <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-[#4e3c20] via-[#B08D57] to-[#4e3c20] rounded-lg overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image */}
              <div className="flex-1 flex items-center justify-center bg-black/20">
                <img
                  src={selectedPost.post_url}
                  alt={selectedPost.caption}
                  className="max-w-full max-h-[60vh] md:max-h-[80vh] object-contain"
                />
              </div>

              {/* Details */}
              <div className="w-full md:w-80 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full" />
                    <span className="text-white font-medium">Luxury Brand</span>
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-white/90 text-sm leading-relaxed mb-4">
                    {selectedPost.caption}
                  </p>
                  <p className="text-white/50 text-xs">
                    {formatDate(selectedPost.created_at)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-6">
                    <Send className="w-6 h-6 text-white/70 hover:text-white transition-colors cursor-pointer" />
                    <Link className="w-6 h-6 text-white/70 hover:text-white transition-colors cursor-pointer" />
                    <ArrowDownToLine className="w-6 h-6 text-white/70 hover:text-white transition-colors cursor-pointer" />
                  </div>
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