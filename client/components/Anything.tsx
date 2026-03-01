import React from 'react'

const Anything = () => {
    return (
        /* Removed background glow div, kept deep black background */
        <div className="min-h-screen bg-black text-white p-4 md:p-8 relative overflow-hidden font-sans">
            
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-8 md:mb-16">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight tracking-tight">
                        AI that  
                        <span className="text-white"> understands</span> every pixel of <br className="hidden md:block" />
                         your video
                    </h1>
                    <p className="text-zinc-300 text-base md:text-lg px-4 md:px-0 max-w-2xl mx-auto">
                        The most powerful AI editing models that work on any video. Built for speed, accuracy, and
                        creative flexibility.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    {/* Card 1 */}
                    <div className="rounded-[1.5rem] p-6 md:p-8 bg-[#0a0a0a] border border-white/10 hover:border-white/30 transition-all duration-300 group">
                        <div className="rounded-xl aspect-video overflow-hidden mb-6 border border-white/5 bg-[#111]">
                            <img src="/anything.avif" alt="anything" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold mb-4 text-white">ClipAnything</h2>
                        <p className="text-zinc-300 text-sm leading-relaxed">
                            Every other AI clipping tool only works with video podcasts. ClipAnything is the only AI clipping model that turns any genre — vlogs, gaming, sports, interviews, explainer videos — into viral clips in 1 click.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="rounded-[1.5rem] p-6 md:p-8 bg-[#0a0a0a] border border-white/10 hover:border-white/30 transition-all duration-300 group">
                        <div className="rounded-xl aspect-video overflow-hidden mb-6 border border-white/5 bg-[#111]">
                            <video className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" loop muted autoPlay playsInline>
                                <source src="/reframe anything.mp4" type="video/mp4" />
                            </video>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold mb-4 text-white">ReframeAnything</h2>
                        <p className="text-zinc-300 text-sm leading-relaxed">
                            The only AI reframe model that resizes any video for any platform and keeps moving subjects centered with AI object tracking. If you want more control, use manual tracking to instruct AI exactly what to follow.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Anything