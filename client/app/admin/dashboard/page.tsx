'use client'

import React from 'react'
import { motion } from 'framer-motion'

const Page = () => {
    return (
        <motion.div
            className="min-h-screen flex flex-col items-center justify-center text-white font-light px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
        >
            <motion.h1
                className="text-3xl md:text-5xl tracking-wide mb-4 text-center"
                style={{ color: '#B08D57' }}
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
            >
                We are Currently Upgrading
            </motion.h1>

            <motion.p
                className="text-base md:text-lg max-w-xl text-center text-muted-foreground"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
            >
                Elevating your experience for creators, models, and celebrities.
                <br />
                Expect a more powerful, luxurious AI tool — built for your spotlight.
            </motion.p>

            <motion.div
                className="mt-8 border-t border-[#B08D57] w-24"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
            />
        </motion.div>
    )
}

export default Page
