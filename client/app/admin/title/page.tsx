"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

const Page = () => {
  const [file, setFile] = useState<File | null>(null)
  const [titles, setTitles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("https://cravio-ai.onrender.com/api/thumb2title", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      setTitles(data.titles || [])
    } catch (err) {
      console.error("Upload failed", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-10">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-bold text-[#47FFE7] drop-shadow-[0_0_8px_#47FFE7]"
      >
        Thumbnail to Viral Title 🔥
      </motion.h1>

      <Card className="mt-6 p-6 w-full max-w-xl">
        <CardContent className="space-y-4">
          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full"
          />

          <Button onClick={handleUpload} disabled={!file || loading} className="w-full">
            {loading ? "Generating..." : "Generate Titles"}
          </Button>

          {titles.length > 0 && (
            <div className="mt-4 space-y-3">
              <h2 className="text-xl font-semibold text-[#47FFE7] drop-shadow-[0_0_6px_#47FFE7] flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> Generated Titles:
              </h2>
              <ul className="list-disc list-inside text-white">
                {titles.map((title, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    {title}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Page