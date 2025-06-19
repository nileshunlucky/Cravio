import React from 'react'

const Anything = () => {
    return (
        <div className="min-h-screen p-8">
            <div className="text-center mb-16">
                <div className="text-zinc-500 text-sm mb-4 flex items-center justify-center gap-2">
                    <span>✨</span>
                    <span>AI EDITING MODELS</span>
                </div>
                <h1 className="text-5xl font-bold mb-6">
                    AI that understands every pixel of<br />your video
                </h1>
                <p className="text-zinc-500 text-lg">
                    The most powerful AI editing models that work on any video. Built for speed, accuracy, and<br />creative flexibility.
                </p>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-2 gap-8">

                <div className=" rounded-2xl p-8">
                    <div className="bg-gray-700 rounded-lg aspect-video overflow-hidden">
                        <img src="/anything.avif" alt="anything" className="w-full h-full object-cover" />
                    </div>
                    <h2 className=" font-bold mb-4">ClipAnything</h2>
                    <p className=" text-sm leading-relaxed mb-8">
                        Every other AI clipping tool only works with video podcasts. ClipAnything is the only AI clipping model that turns any genre — vlogs, gaming, sports, interviews, explainer videos — into viral clips in 1 click.
                    </p>
                </div>

                <div className=" rounded-2xl p-8">
                    <div className="rounded-lg aspect-video overflow-hidden mb-4">
                        <video className="w-full h-full object-cover" loop muted autoPlay>
                            <source src="/reframe anything.mp4"  type="video/mp4" />
                        </video>
                    </div>
                    <h2 className=" text-2xl font-bold mb-4">ReframeAnything</h2>
                    <p className=" text-sm leading-relaxed mb-8">
                        The only AI reframe model that resizes any video for any platform and keeps moving subjects centered with AI object tracking. If you want more control, use manual tracking to instruct AI exactly what to follow.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Anything