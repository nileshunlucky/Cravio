import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { Button } from "./ui/button"

export function ClipRangeSlider({
  duration = 120, // total duration in seconds (e.g., 2 minutes)
  value,
  onChange,
  disabled = false
}: {
  duration?: number
  value: [number, number]
  onChange: (range: [number, number]) => void
  disabled?: boolean
}) {
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2">
        <p>Processing timeframe</p>
        <Button className="bg-green-900/50 hover:bg-green-900 text-green-400 font-semibold">Credit saver</Button>
      </div>
      <SliderPrimitive.Root
        className="relative flex w-full touch-none select-none items-center"
        value={value}
        onValueChange={(val) => onChange([val[0], val[1]])}
        min={0}
        max={duration}
        step={1}
        disabled={disabled}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-zinc-700">
          <SliderPrimitive.Range className="absolute h-full bg-white rounded-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full bg-black border border-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full bg-black border border-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
      <div className="flex items-center justify-between text-sm">
        <Button className="bg-black text-white">{formatTime(value[0])}</Button>
        <Button className="bg-black text-white">{formatTime(value[1])}</Button>
      </div>
    </div>
  )
}