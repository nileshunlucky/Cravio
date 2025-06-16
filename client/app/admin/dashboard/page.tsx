'use client'

import React, { useEffect, useState } from 'react'
import Offer from '@/components/Offer'
import OpusClip from '@/components/OpusClip'
import OpusVideos from '@/components/OpusVideos'

const Page = () => {
  const [isOfferVisible, setIsOfferVisible] = useState(false)

  useEffect(() => {
    const claimed = localStorage.getItem('offerClaimed') === 'true'
    if (!claimed) {
      setIsOfferVisible(true)
    }
  }, [])

  return (
    <div>
      <Offer show={isOfferVisible} onClose={() => setIsOfferVisible(false)} />
      <OpusClip />
      <OpusVideos />
    </div>
  )
}

export default Page
