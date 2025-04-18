'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DownloadCloud, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type Props = {
  fileUrl: string | null
  isLoading: boolean
}

const LoadingAndDownload = ({ fileUrl, isLoading }: Props) => {
  const [showDownload, setShowDownload] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && fileUrl) {
      setShowDownload(true)
    }
  }, [isLoading, fileUrl])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-xl mx-auto mt-10 shadow-2xl border-0 rounded-2xl">
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center space-y-6"
              >
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <div className="absolute inset-0 animate-spin-slow rounded-full border-t-4 border-black opacity-30"></div>
                  <div className="absolute inset-0 animate-spin rounded-full border-t-4 border-zinc-500"></div>
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={80}
                    height={80}
                    className="rounded-full z-10"
                  />
                </div>
                <p className="text-lg font-medium text-black text-center">Processing your Reddit post…</p>
              </motion.div>
            ) : showDownload && fileUrl ? (
              <motion.div
                key="download"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center space-y-6"
              >
                <video
                  src={fileUrl}
                  controls
                  className="rounded-lg shadow-md border border-neutral-300 w-full"
                />

                <a href={fileUrl} download target="_blank" rel="noopener noreferrer">
                  <Button className="rounded-xl px-6 py-2 shadow-lg flex items-center gap-2">
                    <DownloadCloud className="w-5 h-5" />
                    Download Now
                  </Button>
                </a>

                <Button
                  variant="outline"
                  className="transition-all mt-2"
                  onClick={() => router.push('/admin/projects')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  BACK
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoadingAndDownload
