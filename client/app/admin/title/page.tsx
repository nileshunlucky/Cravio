"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button" // Assuming shadcn/ui button
import { Card, CardContent } from "@/components/ui/card" // Assuming shadcn/ui card
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, UploadCloud } from "lucide-react"

const Page = () => {
  const [file, setFile] = useState<File | null>(null)
  const [titles, setTitles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0) // State for fake progress

  // Simulate fake loading progress
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (loading) {
      setUploadProgress(0); // Reset progress on new loading cycle
      interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev < 90) { // Stop just before 100 to show completion
            return prev + Math.random() * 5; // Simulate fluctuating progress
          }
          clearInterval(interval!);
          return prev;
        });
      }, 150); // Update every 150ms
    } else {
      if (interval) clearInterval(interval);
      setUploadProgress(0); // Reset progress when not loading
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setTitles([]) // Clear previous titles
    setUploadProgress(0); // Ensure progress starts from 0

    const formData = new FormData()
    formData.append("file", file)

    try {
      // Simulate network delay for progress bar effect if needed, otherwise remove this
      // await new Promise(resolve => setTimeout(resolve, 1000));

      const res = await fetch("https://cravio-ai.onrender.com/api/thumb2title", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json()
      console.log(data)
      setTitles(data.titles || [])
    } catch (err) {
      console.error("Upload failed", err)
      // Optionally, set an error message in the UI
    } finally {
      setUploadProgress(100); // Complete the progress bar
      // Give a slight delay for the progress bar to show 100% before disappearing
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-10 bg-black text-white relative overflow-hidden">
      {/* Background glow effect */}
      <motion.div
        className="absolute inset-0 z-0 opacity-20"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.2 }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }}
        style={{
          background: "radial-gradient(circle at center, #47FFE7, transparent 70%)",
          filter: "blur(100px)"
        }}
      />

      <Card className="mt-6 p-8 w-full max-w-xl bg-gray-900 border border-[#47FFE7]/30 shadow-lg shadow-[#47FFE7]/10 relative z-10">
        <CardContent className="space-y-6">
          <label htmlFor="file-upload" className="cursor-pointer block text-center border-2 border-dashed border-[#47FFE7]/50 rounded-lg p-6 hover:border-[#47FFE7] transition-colors duration-200 group">
            <input
              id="file-upload"
              type="file"
              accept="image/png, image/jpeg, image/webp" // Added webp support
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-[#47FFE7] transition-colors duration-200">
              <UploadCloud className="h-10 w-10 mb-2" />
              <p className="font-medium">
                {file ? file.name : "Drag & Drop your thumbnail here, or Click to Select"}
              </p>
              {file && (
                <p className="text-sm text-gray-500 mt-1">Ready to upload.</p>
              )}
            </div>
          </label>

          <Button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full bg-[#47FFE7] text-gray-900 font-bold py-3 rounded-md hover:bg-[#33ccb3] transition-colors duration-200 relative overflow-hidden group"
            style={{
              boxShadow: !loading ? "0 0 15px rgba(71, 255, 231, 0.5)" : "none",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-gray-900" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Titles...
              </span>
            ) : (
              "Generate Titles"
            )}
            {/* Progress Bar */}
            {loading && (
              <motion.div
                className="absolute top-0 left-0 h-full bg-[#47FFE7]/30 rounded-md"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
                style={{
                  boxShadow: "0 0 10px rgba(71, 255, 231, 0.7)",
                }}
              />
            )}
            {/* Button hover glow */}
            <span className="absolute inset-0 rounded-md bg-[#47FFE7] opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
          </Button>

          <AnimatePresence>
            {titles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
                className="mt-6 space-y-4"
              >
                <h2 className="text-2xl font-semibold text-[#47FFE7] drop-shadow-[0_0_8px_#47FFE7] flex items-center gap-3">
                  <Sparkles className="h-6 w-6" /> Viral Titles Generated:
                </h2>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  {titles.map((title, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.1, duration: 0.4 }}
                      className="flex items-start"
                    >
                      <span className="mr-2 text-[#47FFE7]">•</span>
                      <span>{title}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}

export default Page