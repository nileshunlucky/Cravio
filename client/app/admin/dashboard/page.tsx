'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'

const Page = () => {

  return (
    <div className="min-h-screen flex items-center justify-center px-4 w-full">
      <motion.div
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        className="w-full max-w-xl"
      >
       <Link href='/admin/reddit-story'><Card
          className="cursor-pointer rounded-2xl  bg-gradient-to-br from-orange-500 via-orange-400 to-red-500 shadow-[0_0_20px_#11111180] hover:shadow-[0_0_30px_#1a1a1a90] transition-all duration-300"
        >
          <div className="p-6 space-y-2">
            <div className="flex items-center space-x-2">
              <Image src="/reddit.png" width={34} height={34} alt="Reddit" />
              <h1 className="text-2xl font-semibold text-white">
                Reddit Story
              </h1>
            </div>
            <p className="text-sm text-white">
              Start the process of transforming Reddit threads into dynamic AI-generated story videos. Powered by automation and precision.
            </p>
            <Button
              variant="secondary"
              className="mt-4 bg-white text-black hover:bg-neutral-200"
            >
              Start Creating
            </Button>
          </div>
        </Card></Link>
      </motion.div>
    </div>
  )
}

export default Page
