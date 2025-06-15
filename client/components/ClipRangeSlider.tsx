import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

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
      <div className="flex justify-between text-sm text-zinc-300">
        <span>Start: {formatTime(value[0])}</span>
        <span>Duration: {formatTime(duration)}</span>
        <span>End: {formatTime(value[1])}</span>
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
        <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full bg-white border-2 border-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
        <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full bg-white border-2 border-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
      <div className="text-xs text-zinc-400 text-center">
        Selected clip: {formatTime(value[1] - value[0])} ({Math.ceil((value[1] - value[0]) / 60)} credits)
      </div>
    </div>
  )
}