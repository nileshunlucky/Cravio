"use client"

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { Send, Link, ArrowDownToLine } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Post Link Copied", {
        style: {
          background: "linear-gradient(to bottom right, #4e3c20, #B08D57, #4e3c20)",
          color: "black",
          border: "0px"
        }
      })
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      toast.error("Failed to copy to clipboard", {
        style: {
          background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
          color: "white",
          border: "0px"
        }
      });
    }
  };

  const sharePost = async (url: string, caption: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check this out!',
          text: caption,
          url: url,
        });
      } catch (err) {
        console.error("Error sharing:", err);
        toast.error("Failed to share", {
          style: {
            background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
            color: "white",
            border: "0px"
          }
        });
      }
    } else {
      toast.error("Share not supported on this browser.", {
        style: {
          background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
          color: "white",
          border: "0px"
        }
      });
    }
  };

  const downloadImage = async (imageUrl: string) => {
    try {
      // Use your FastAPI backend URL
      const proxyUrl = `https://cravio-ai.onrender.com/proxy-image?url=${encodeURIComponent(imageUrl)}`
      const response = await fetch(proxyUrl)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `Post-${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)

      toast.success("Post Downloaded!", {
        style: {
          background: "linear-gradient(to bottom right, #4e3c20, #B08D57, #4e3c20)",
          color: "black",
          border: "0px"
        }
      })
    } catch (error) {
      console.error("Download failed:", error)
      toast.error("Download failed. Opening image in new tab...", {
        style: {
          background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
          color: "white",
          border: "0px"
        }
      })
      window.open(imageUrl)
    }
  }

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
          setPosts(Array.isArray(data.posts) ? data.posts : []);
        }

      } catch (error) {
        console.error("Failed to fetch user data:", error)
        setPosts([]) // Fallback to empty array
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
      <div className="min-h-screen p-4">
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

  // Show empty state when no posts
if (!loading && posts.length === 0) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-black relative overflow-hidden">
      {/* Subtle background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/20 via-transparent to-zinc-800/10 pointer-events-none" />
      
      {/* Floating orbs for ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-amber-500/3 to-orange-500/3 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="relative z-10 text-center space-y-8 max-w-2xl mx-auto">

        {/* Heading with refined typography */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
            <span className="bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Create your first
            </span>
            <br />
            <span className="bg-gradient-to-r from-zinc-300 to-zinc-500 bg-clip-text text-transparent font-light">
              masterpiece
            </span>
          </h1>
          
          <p className="text-zinc-400 text-lg md:text-xl max-w-lg mx-auto leading-relaxed font-light">
            Transform your ideas into stunning visual stories with our 
            <span className="text-zinc-300"> intuitive canvas</span>.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <button
            onClick={() => router.push('/admin/canvas')}
            className="group relative inline-flex items-center justify-center"
          >
            {/* Button Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#E5C88C] via-[#B08D57] to-[#A47A3E] rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
            
            {/* Button Surface */}
            <div className="relative bg-gradient-to-r from-[#E5C88C] via-[#B08D57] to-[#A47A3E] text-black px-8 py-4 rounded-2xl font-medium text-lg shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/40 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-amber-400/20">
              <span className="flex items-center gap-3">
                Get Started
                <svg 
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17 8l4 4m0 0l-4 4m4-4H3" 
                  />
                </svg>
              </span>
            </div>
          </button>
        </div>

        {/* Subtle hint text */}
        <p className="text-zinc-600 text-sm font-light">
          No posts yet — but that&rsquo;s about to change
        </p>
      </div>
    </div>
  )
}

  return (
    <div className="min-h-screen">
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
                    {user?.imageUrl && (
                      <img
                        src={user.imageUrl}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    <span className="text-white font-medium">{user?.fullName}</span>
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
                    <Send onClick={() => sharePost(selectedPost.post_url, selectedPost.caption)} className="w-6 h-6 text-white/70 hover:text-white transition-colors cursor-pointer" />
                    <Link onClick={() => copyToClipboard(selectedPost.post_url)} className="w-6 h-6 text-white/70 hover:text-white transition-colors cursor-pointer" />
                    <ArrowDownToLine onClick={() => downloadImage(selectedPost.post_url)} className="w-6 h-6 text-white/70 hover:text-white transition-colors cursor-pointer" />
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