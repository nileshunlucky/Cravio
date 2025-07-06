"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, UploadCloud, Image, Wand2 } from "lucide-react"
import { useUser } from '@clerk/nextjs'

const Page = () => {
  const [file, setFile] = useState<File | null>(null)
  const [titles, setTitles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const { user } = useUser()
  const email = user?.emailAddresses?.[0]?.emailAddress

  // Simulate premium loading progress
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (loading) {
      setUploadProgress(0);
      interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev < 95) {
            return prev + Math.random() * 3;
          }
          clearInterval(interval!);
          return prev;
        });
      }, 100);
    } else {
      if (interval) clearInterval(interval);
      setUploadProgress(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setTitles([]); // Clear previous titles
    
    // Create image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setTitles([])
    setUploadProgress(0);

    const formData = new FormData()
    formData.append("file", file)
    formData.append("email", email || '')

    try {
      const res = await fetch("https://cravio-ai.onrender.com/api/thumb2title", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json()
      
      // Ensure we only show 3 titles
      const generatedTitles = data.titles ? data.titles.slice(0, 3) : []
      setTitles(generatedTitles)
    } catch (err) {
      console.error("Upload failed", err)
    } finally {
      setUploadProgress(100);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden my-5">
      {/* Premium background effects */}
      <motion.div
        className="absolute inset-0 opacity-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 2 }}
      >
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#47FFE7] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-[#47FFE7] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-2xl relative z-10"
      >

        <Card className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-[#47FFE7]/5">
          <CardContent className="p-8">
            {/* File Upload Area */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <label
                htmlFor="file-upload"
                className="relative block cursor-pointer group"
              >
                <input
                  id="file-upload"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                
                <div className="border-3  border-slate-600 rounded-2xl p-8 text-center transition-all duration-300 group-hover:border-[#47FFE7]/50 group-hover:bg-slate-700/20 relative overflow-hidden">
                  {/* Subtle glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#47FFE7]/0 via-[#47FFE7]/5 to-[#47FFE7]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative z-10">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <div className="relative inline-block">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-32 h-20 object-cover rounded-lg shadow-lg"
                          />
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#47FFE7] rounded-full flex items-center justify-center">
                            <Image className="w-3 h-3 text-slate-900" />
                          </div>
                        </div>
                        <div>
                          <p className="text-[#47FFE7] font-medium">{file?.name}</p>
                          <p className="text-slate-400 text-sm mt-1">Ready to generate titles</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 group-hover:text-[#47FFE7] transition-colors duration-300">
                        <UploadCloud className="w-12 h-12 mx-auto mb-4 opacity-80" />
                        <p className="text-lg font-medium mb-2">Drop your thumbnail here</p>
                        <p className="text-sm opacity-80">or click to browse files</p>
                        <p className="text-xs mt-2 opacity-60">PNG, JPEG, WEBP supported</p>
                      </div>
                    )}
                  </div>
                </div>
              </label>
            </motion.div>

            {/* Generate Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Button
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full h-14 bg-gradient-to-r from-[#47FFE7] to-[#33ccb3] text-slate-900 font-bold text-lg rounded-xl relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                style={{
                  boxShadow: !loading && file ? "0 0 30px rgba(71, 255, 231, 0.3)" : "none",
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <motion.div
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Wand2 className="w-5 h-5" />
                    </motion.div>
                    <span>Generating Magic...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Viral Titles</span>
                  </div>
                )}
                
                {/* Premium Progress Bar */}
                {loading && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.1, ease: "easeOut" }}
                    style={{
                      boxShadow: "0 0 10px rgba(255, 255, 255, 0.8)",
                    }}
                  />
                )}
                
                {/* Button glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#47FFE7]/0 via-white/20 to-[#47FFE7]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
            </motion.div>
          </CardContent>
        </Card>

        {/* Generated Titles */}
        <AnimatePresence>
          {titles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mt-8"
            >
              <Card className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-[#47FFE7]/10">
                <CardContent className="p-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                  >
                    <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-[#47FFE7] to-white bg-clip-text flex items-center gap-3">
                      <motion.div
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-6 h-6 text-[#47FFE7]" />
                      </motion.div>
                      Your Viral Titles
                    </h2>
                  </motion.div>

                  <div className="space-y-4">
                    {titles.map((title, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -30, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ 
                          delay: 0.3 + idx * 0.2, 
                          duration: 0.5,
                          type: "spring",
                          stiffness: 120
                        }}
                        className="group"
                      >
                        <div className="bg-gradient-to-r from-slate-700/30 to-slate-700/10 backdrop-blur-sm rounded-xl p-4 border border-slate-600/30 hover:border-[#47FFE7]/30 transition-all duration-300 cursor-pointer group-hover:shadow-lg group-hover:shadow-[#47FFE7]/10">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-[#47FFE7] to-[#33ccb3] rounded-full flex items-center justify-center text-slate-900 font-bold text-sm">
                              {idx + 1}
                            </div>
                            <p className="text-white font-medium leading-relaxed group-hover:text-[#47FFE7] transition-colors duration-300">
                              {title}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default Page