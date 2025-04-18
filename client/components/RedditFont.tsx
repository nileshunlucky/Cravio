'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import clsx from 'clsx'

const fontStyles = [
  { label: 'red', className: 'text-[32px] font-bold text-red-600' },
  { label: 'blue', className: 'text-[32px] font-bold text-blue-600' },
  { label: 'green', className: 'text-[32px] font-bold text-green-600' },
  { label: 'purple', className: 'text-[32px] font-bold text-purple-600' },
  { label: 'orange', className: 'text-[32px] font-bold text-orange-500' },
  { label: 'black', className: 'text-[32px] font-bold text-black' },
  { label: 'gray', className: 'text-[32px] font-bold text-gray-600' },
  { label: 'pink', className: 'text-[32px] font-bold text-pink-500' },
  { label: 'yellow', className: 'text-[32px] font-bold text-yellow-500' },
]

const RedditFont = ({ value, onChange, onNext, onBack }: any) => {
  const [selected, setSelected] = useState(value || 0)

  const handleNext = () => {
    onChange(fontStyles[selected]?.label || 'red')
    onNext()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Select Subtitle Color</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {fontStyles.map((style, index) => (
          <div
            key={index}
            className={clsx(
              'p-4 border rounded-md cursor-pointer flex items-center justify-center h-[100px] transition',
              selected === index ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white'
            )}
            onClick={() => setSelected(index)}
          >
            <span className={style.className}>WORD</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  )
}

export default RedditFont
