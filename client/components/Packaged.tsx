"use client"

import React, { useEffect, useState } from 'react'

const Packaged = () => {
  const [thumbnailCount, setThumbnailCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Define types for user and thumbnail based on your database structure
  type Thumbnail = {
    model?: string
    original_url?: string
    watermarked_url?: string
    job_id?: string
    watermarked?: boolean
    created_at?: {
      $date: string
    }
  }

  type User = {
    _id?: {
      $oid: string
    }
    email?: string
    credits?: number
    balance?: number
    thumbnail?: Thumbnail[]
    [key: string]: unknown
  }

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        console.log('Fetching user data...')
        const res = await fetch(`https://cravio-ai.onrender.com/users-full`)
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        
        const data: User[] = await res.json()
        console.log('Fetched data:', data)
        console.log('Total users found:', data.length)
        
        // Count total thumbnails - counting each thumbnail once, but considering both URLs
        let totalThumbnails = 0
        let totalUrls = 0
        
        data.forEach((user: User, userIndex) => {
          console.log(`Processing user ${userIndex + 1}:`, user.email)
          
          if (user.thumbnail && Array.isArray(user.thumbnail)) {
            console.log(`User ${userIndex + 1} has ${user.thumbnail.length} thumbnails`)
            
            user.thumbnail.forEach((thumb, thumbIndex) => {
              console.log(`  Thumbnail ${thumbIndex + 1}:`, {
                has_original: !!thumb.original_url,
                has_watermarked: !!thumb.watermarked_url,
                model: thumb.model
              })
              
              // Count the thumbnail entry itself
              totalThumbnails++
              
              // Count individual URLs for combined count
              if (thumb.original_url && thumb.original_url.trim()) {
                totalUrls++
              }
              if (thumb.watermarked_url && thumb.watermarked_url.trim()) {
                totalUrls++
              }
            })
          } else {
            console.log(`User ${userIndex + 1} has no thumbnails or invalid thumbnail structure`)
          }
        })
        
        console.log('Final counts:', {
          totalThumbnails,
          totalUrls
        })
        
        // Use the combined URL count as requested
        setThumbnailCount(totalUrls)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching user count:', error)
        setLoading(false)
        setThumbnailCount(1)
      }
    }

    fetchUserCount()
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

const textGlowStyle = {
  filter: 'drop-shadow(0 0 10px rgba(71, 255, 231, 0.5))',
};

const whiteTextGlowStyle = {
  filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.6))',
  color: '#ffffff'
};


  return (
    <div className="relative py-20 px-6 overflow-hidden">
      <div className="relative max-w-6xl mx-auto text-center space-y-16">
        {/* Header */}
        <div className="space-y-6">
          <h2 
            className="md:text-2xl font-medium tracking-wide whitespace-nowrap"
            style={{ color: '#47FFE7', ...textGlowStyle }}
          >
            Thumbnails Packaged with Cravio:
          </h2>
          
          {/* Main Counter */}
          <div className="relative" style={whiteTextGlowStyle}>
            {loading ? (
              <div className="text-7xl md:text-9xl font-bold animate-pulse">
                757+
              </div>
            ) : (
              <div className="text-7xl md:text-9xl font-bold tracking-tight " >
                {thumbnailCount > 0 ? formatNumber(thumbnailCount) : '0'}+
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  )
}

export default Packaged