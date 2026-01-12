"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, HelpCircle, MessageSquare, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const PricingPage = () => {
    const [isYearly, setIsYearly] = useState(true);

    // Simplified to just the Starter plan
    const plan = { name: "Starter", price: 19, credits: 300 };

    const discountFactor = isYearly ? 0.5 : 1;
    const displayedPrice = (plan.price * discountFactor).toFixed(2);
    const totalBilled = (parseFloat(displayedPrice) * 12).toFixed(2);

    const faqs = [
        { question: "Can I cancel my plan?", answer: "Yes. You can cancel your plan anytime via settings." },
        { question: "How do I view remaining credits?", answer: "You can view your credit usage in the top right corner." },
        { question: "Do you have a refund policy?", answer: "Unfortunately, we do not offer refunds. You can cancel your plan anytime and your plan will remain active until the end of the billing cycle." },
        { question: "Can I monetize videos?", answer: "Yes, you own 100% of the rights to your creations." },
    ];

    return (
        <div className="min-h-screen bg-black text-white py-16 px-4 font-sans">
            {/* Header Toggle */}
            <div className="flex flex-col items-center mb-12">
                <div className="flex items-center gap-4 mb-2">
                    <span className={cn("text-lg font-medium", !isYearly ? "text-white" : "text-zinc-500")}>Monthly</span>
                    <button 
                        onClick={() => setIsYearly(!isYearly)}
                        className="w-14 h-7 bg-zinc-800 rounded-full p-1 transition-colors relative"
                    >
                        <div className={cn(
                            "w-5 h-5 bg-white rounded-full transition-transform",
                            isYearly ? "translate-x-7" : "translate-x-0"
                        )} />
                    </button>
                    <span className={cn("text-lg font-medium", isYearly ? "text-white" : "text-zinc-500")}>Yearly</span>
                </div>
                <p className="text-green-500 font-medium">Save up to 50% with annual billing</p>
            </div>

            {/* Pricing Card */}
            <div className="max-w-[450px] mx-auto mb-20">
                <Card className="bg-black border border-zinc-800 rounded-3xl overflow-hidden text-white">
                    <CardHeader className="pt-8 px-8">
                        <CardTitle className="text-3xl font-bold mb-1">{plan.name}</CardTitle>
                        <p className="text-zinc-400 text-sm">For professional creators, marketers, & teams</p>
                        
                        <div className="flex items-baseline gap-3 mt-6">
                            <span className="text-4xl font-bold ">${displayedPrice} <span className="text-lg text-zinc-400 font-normal">/mo</span></span>
                        </div>
                    </CardHeader>

                    <CardContent className="px-8 pb-8">
                        <a href="" className="block w-full mb-6">
                            <Button className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-6 text-lg rounded-xl">
                               Get {plan.name}
                            </Button>
                        </a>

                        <div className="space-y-4">
                            {isYearly && (
                                <p className="text-sm font-bold flex items-center gap-2">
                                    ${totalBilled} billed annually 
                                </p>
                            )}
                            
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-zinc-400" />
                                    <span className="text-sm font-bold">{isYearly ? plan.credits * 12 : plan.credits} credits <Info className="inline w-3 h-3 text-zinc-500" /> per {isYearly ? "year" : "month"}, available instantly</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-zinc-400" />
                                    <span className="text-sm font-medium text-zinc-300"><strong>Virality Score</strong></span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-zinc-400" />
                                    <span className="text-sm font-medium text-zinc-300">Multiple aspect ratios (9:16, 1:1, 16:9)</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-zinc-400" />
                                    <span className="text-sm font-medium text-zinc-300">Speech enhancement</span>
                                </li>
                            </ul>
                            <p className="text-zinc-500 text-xs font-bold pt-2 uppercase tracking-wider">Exclusive Support</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* FAQ Section */}
            <div className="max-w-3xl mx-auto border-t border-zinc-900 pt-16">
                <h2 className="text-3xl font-bold mb-8 text-center">Frequently asked questions</h2>
                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border-zinc-800">
                            <AccordionTrigger className="hover:no-underline text-zinc-200">
                                <div className="flex items-center text-left">
                                    <HelpCircle className="h-5 w-5 mr-3 text-zinc-500" />
                                    {faq.question}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-zinc-400 ml-8">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>

                <div className="mt-12 p-8 rounded-2xl border border-zinc-800 bg-zinc-950/50 text-center">
                    <h3 className="text-xl font-bold mb-2">Please chat to our friendly team</h3>
                    <p className="text-zinc-400 mb-6">We&apos;re here to help with any questions you might have.</p>
                    <a href="mailto:mellvitta.ai@gmail.com">
                        <Button className="bg-[#c3002b] hover:bg-[#a00024] text-white px-8">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Get in touch
                        </Button>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;