"use client";

import React from 'react'
import Link from 'next/link'


const page = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-black relative overflow-hidden">
      {/* Subtle background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/20 via-transparent to-zinc-800/10 pointer-events-none" />
      
      {/* Floating orbs for ambient lighting */}
  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-white/10 to-white/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-amber-500/3 to-orange-500/3 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="relative z-10 text-center space-y-8 max-w-2xl mx-auto">

        {/* Heading with refined typography */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
            <span className="bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Clone your first
            </span>
            <br />
            <span className="bg-gradient-to-r from-zinc-300 to-zinc-500 bg-clip-text text-transparent font-light">
              masterpiece
            </span>
          </h1>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <Link href="/admin/personas"><button
            className="group relative inline-flex items-center justify-center"
          >
            {/* Button Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#E5C88C] via-[#B08D57] to-[#A47A3E] rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
            
            {/* Button Surface */}
            <div className="relative bg-gradient-to-r from-[#E5C88C] via-[#B08D57] to-[#A47A3E] text-black px-8 py-4 rounded-2xl font-medium text-lg shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/40 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-amber-400/20">
              <span className="flex items-center gap-3">
                Create Persona
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
          </button></Link>
        </div>
      </div>
    </div>
  )
}

export default page
