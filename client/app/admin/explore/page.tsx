'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import CanvasExplore from '@/components/CanvasExplore'
import DevilExplore from '@/components/DevilExplore'

const Page = () => {
  const [activeTemplate, setActiveTemplate] = useState<string>('canvas')

  const templates = [
    { id: 'canvas', label: 'Canvas', href: '#canvas' },
    { id: 'devil', label: 'Devil', href: '#devil' }
  ]

  // Scroll detection to update active template
  useEffect(() => {
    const handleScroll = () => {
      const canvasElement = document.getElementById('canvas')
      const devilElement = document.getElementById('devil')
      
      if (!canvasElement || !devilElement) return

      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const offset = windowHeight * 0.5 // Trigger when element is 50% in view

      const canvasTop = canvasElement.offsetTop
      const devilTop = devilElement.offsetTop

      if (scrollY + offset >= devilTop) {
        setActiveTemplate('devil')
      } else if (scrollY + offset >= canvasTop) {
        setActiveTemplate('canvas')
      }
    }

    // Add scroll listener
    window.addEventListener('scroll', handleScroll)
    
    // Initial check
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleTemplateClick = (templateId: string, href: string) => {
    setActiveTemplate(templateId)
    
    // Smooth scroll to section
    const element = document.querySelector(href) as HTMLElement
    if (element) {
      const headerHeight = 120 // Increased height to account for navbar + sticky header
      const elementTop = element.offsetTop - headerHeight
      
      window.scrollTo({
        top: elementTop,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="min-h-screen">
      {/* Template Selector - Sticky positioning */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-zinc-900">
        <div className="flex justify-center items-center gap-8 py-6">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              className="relative"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={() => handleTemplateClick(template.id, template.href)}
                className="block cursor-pointer"
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
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div id="canvas">
          <CanvasExplore />
        </div>
        <div id="devil">
          <DevilExplore />
        </div>
      </motion.div>
    </div>
  )
}

export default Page