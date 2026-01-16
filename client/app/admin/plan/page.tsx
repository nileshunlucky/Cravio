"use client";

import React, { useState } from 'react';
import { Check, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const PricingPage = () => {
    const [isYearly, setIsYearly] = useState(true);

    // Pricing Logic
    const monthlyPrice = 19;
    const yearlyPrice = 9.5; // 50% discount
    const currentPrice = isYearly ? yearlyPrice : monthlyPrice;

    const features = [
        { label: "300 credits", included: true },
        { label: "Works in Any Language", included: true },
        { label: "Prompt-to-Thumbnail", included: true },
        { label: "Recreate", included: true },
        { label: "Edit", included: true },
        { label: "Pikzels Score™", included: false },
        { label: "One-Click Fix™", included: false },
        { label: "Personas", included: false },
        { label: "Styles", included: false },
        { label: "FaceSwap", included: false },
        { label: "Titles", included: false },
        { label: "All Generations Remain Private", included: false },
        { label: "Early Access to New Features", included: false },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white py-20 px-4 font-sans selection:bg-teal-500/30">
            {/* Header Section */}
            <div className="max-w-4xl mx-auto text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                    Start Creating <br />
                    with <span className="text-[#4ade80]">Pikzels Today</span>
                </h1>
                <p className="text-zinc-400 mb-8">No surprises or hidden fees. Cancel anytime.</p>

                {/* Toggle Switch */}
                <div className="flex flex-col items-center gap-4">
                    <div className="bg-zinc-900/50 p-1 rounded-full flex items-center border border-zinc-800">
                        <button
                            onClick={() => setIsYearly(false)}
                            className={cn(
                                "px-6 py-2 rounded-full text-sm font-medium transition-all",
                                !isYearly ? "bg-zinc-800 text-white" : "text-zinc-500"
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsYearly(true)}
                            className={cn(
                                "px-6 py-2 rounded-full text-sm font-medium transition-all",
                                isYearly ? "bg-[#2da683] text-white" : "text-zinc-500"
                            )}
                        >
                            Annually
                        </button>
                    </div>
                    <p className="text-[#4ade80] text-sm font-medium">
                        Save 50% with our annual plans
                    </p>
                </div>
            </div>

            {/* Pricing Card */}
            <div className="max-w-[400px] mx-auto relative group">
                {/* The Teal Glow Effect */}
                <div className="absolute -inset-1 bg-[#2da683] rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                
                <div className="relative bg-[#121212] border border-zinc-800 rounded-[2.5rem] p-8 h-full shadow-2xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-[#4ade80]">Starter</h2>
                            <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                -50%
                            </span>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                            <span className="text-zinc-500 text-2xl line-through decoration-zinc-600 mr-1">$19</span>
                            <span className="text-4xl font-bold text-[#4ade80]">${currentPrice}</span>
                            <span className="text-zinc-500 font-medium">/mo</span>
                        </div>
                        <p className="text-zinc-500 text-sm mt-1">Billed {isYearly ? 'Annually' : 'Monthly'}</p>
                        <p className="text-zinc-400 text-sm mt-4">
                            Generate up to <span className="text-[#4ade80] font-bold">{isYearly ? '3600' : '300'} thumbnails</span> per {isYearly ? 'year' : 'month'}.
                        </p>
                    </div>

                    {/* Features List */}
                    <div className="bg-black/40 rounded-3xl p-6 mb-8 border border-zinc-900">
                        <ul className="space-y-3">
                            {features.map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-3">
                                    {feature.included ? (
                                        <div className="bg-[#10b981] rounded-full p-0.5">
                                            <Check className="w-3 h-3 text-black stroke-[4px]" />
                                        </div>
                                    ) : (
                                        <div className="bg-zinc-800 rounded-full p-0.5">
                                            <X className="w-3 h-3 text-zinc-500 stroke-[4px]" />
                                        </div>
                                    )}
                                    <span className={cn(
                                        "text-xs font-medium",
                                        feature.included ? "text-zinc-200" : "text-zinc-600"
                                    )}>
                                        {feature.label}
                                    </span>
                                    {feature.included && <Info className="w-3 h-3 text-zinc-600" />}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* CTA Button */}
                    <div className="space-y-4 text-center">
                        <button className="w-full bg-[#34d399] hover:bg-[#2da683] text-black font-bold py-4 rounded-full transition-colors">
                            Subscribe
                        </button>
                        <button className="text-zinc-500 text-sm hover:text-white transition-colors underline underline-offset-4">
                            or Start Free Trial ↗
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;