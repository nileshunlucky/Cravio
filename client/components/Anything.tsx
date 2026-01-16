import React from 'react'

const Anything = () => {
    return (
        /* Added bg-[#0a0a0a], text-white, and relative/overflow-hidden for the glow */
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 relative overflow-hidden">
            
            {/* Background Teal Glow - Exact same as your FAQ page */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-teal-500/9 blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-8 md:mb-16">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight">
                        AI that  
                        <span className="text-teal-500"> understands</span> every pixel of <br className="hidden md:block" />
                         your video
                    </h1>
                    <p className="text-gray-400 text-base md:text-lg px-4 md:px-0">
                        The most powerful AI editing models that work on any video. Built for speed, accuracy, and<br className="hidden md:block" />
                        creative flexibility.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    {/* Card 1 */}
                    <div className="rounded-[1.5rem] p-6 md:p-8 bg-[#0d0d0d] border border-white/5 hover:border-teal-500/30 transition-all duration-300">
                        <div className="rounded-lg aspect-video overflow-hidden mb-6 border border-white/5">
                            <img src="/anything.avif" alt="anything" className="w-full h-full object-cover" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold mb-4 text-teal-400">ClipAnything</h2>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6 md:mb-8">
                            Every other AI clipping tool only works with video podcasts. ClipAnything is the only AI clipping model that turns any genre — vlogs, gaming, sports, interviews, explainer videos — into viral clips in 1 click.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="rounded-[1.5rem] p-6 md:p-8 bg-[#0d0d0d] border border-white/5 hover:border-teal-500/30 transition-all duration-300">
                        <div className="rounded-lg aspect-video overflow-hidden mb-6 border border-white/5">
                            <video className="w-full h-full object-cover" loop muted autoPlay>
                                <source src="/reframe anything.mp4" type="video/mp4" />
                            </video>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold mb-4 text-teal-400">ReframeAnything</h2>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6 md:mb-8">
                            The only AI reframe model that resizes any video for any platform and keeps moving subjects centered with AI object tracking. If you want more control, use manual tracking to instruct AI exactly what to follow.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Anything