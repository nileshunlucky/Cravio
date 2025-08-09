'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import CanvasExplore from '@/components/CanvasExplore'
import DevilExplore from '@/components/DevilExplore'

const page = () => {
  const [activeTemplate, setActiveTemplate] = useState<string>('canvas')

  const templates = [
    { id: 'canvas', label: 'Canvas', href: '#canvas' },
    { id: 'devil', label: 'Devil', href: '#devil' }
  ]

  return (
    <div className="min-h-screen">
      {/* Template Selector */}
      <div className="flex justify-center items-center gap-8 py-8 sticky top-0 left-0 right-0 z-50 bg-black border-b border-zinc-900">
        {templates.map((template) => (
          <motion.div
            key={template.id}
            className="relative"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <a
              href={template.href}
              onClick={() => setActiveTemplate(template.id)}
              className="block"
            >
              <p
                className={`text-2xl font-semibold transition-all duration-300 ${
                  activeTemplate === template.id
                    ? 'bg-gradient-to-br from-[#B08D57] to-[#4e3c20] bg-clip-text text-transparent'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {template.label}
              </p>
              
              {/* Active underline indicator */}
              {activeTemplate === template.id && (
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#B08D57] to-[#4e3c20]"
                  layoutId="underline"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                />
              )}
            </a>
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <CanvasExplore />
        <DevilExplore />
      </motion.div>
    </div>
  )
}

export default page