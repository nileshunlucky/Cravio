"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, HelpCircle, MessageSquare, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useUser } from '@clerk/clerk-react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Define types for Razorpay
interface RazorpayOptions {
    key: string;
    subscription_id: string;
    name: string;
    description: string;
    theme: { color: string };
    handler: (response: RazorpayResponse) => void;
    prefill: {
        name: string;
        email: string;
    };
}

declare global {
    interface Window {
        fbq: (action: string, event: string, parameters?: Record<string, any>) => void;
    }
}

interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

interface RazorpayWindow extends Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
}

interface RazorpayInstance {
    open(): void;
    on(event: string, callback: (data: RazorpayResponse) => void): void;
}

interface PricingPlan {
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    description: string;
    features: string[];
    highlight?: boolean;
    monthlyCredit: number;
    yearlyCredit: number;
    monthlyPlanId: string;
    yearlyPlanId: string;
}

const Plans: React.FC = () => {
    const { user } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isYearly, setIsYearly] = useState(true); // Default to yearly
    const [showMobileTip, setShowMobileTip] = useState(false);

    const pricingPlans: PricingPlan[] = [
        {
            name: 'STARTER',
            monthlyPrice: 19,
            yearlyPrice: 9.5,
            monthlyCredit: 300,
            yearlyCredit: 3600, // 300 * 12
            monthlyPlanId: "plan_QZrlzY5jFsQOgb",
            yearlyPlanId: "plan_QhR8PRglXbPiag", // Add your yearly plan ID
            description: 'Perfect for beginners and small projects',
            features: ['Credits per month', 'AI clipping with Virality Score', 'Powerful editor', "Remove Watermark"],
        },
        {
            name: 'PRO',
            monthlyPrice: 49,
            yearlyPrice: 24.5,
            monthlyCredit: 800,
            yearlyCredit: 9600, // 800 * 12
            monthlyPlanId: "plan_QZrmhupRIuRSJI",
            yearlyPlanId: "plan_QhR9XPSR0wt7Ql", // Add your yearly plan ID
            description: 'Ideal for professionals and growing businesses',
            features: ['Credits per month', 'Everything in STARTER plan, plus:', "Multiple aspect ratios (9:16, 1:1, 16:9)", "Speech enhancement", 'Priority email & chat support'],
            highlight: true
        },
        {
            name: 'PREMIUM',
            monthlyPrice: 69,
            yearlyPrice: 34.5,
            monthlyCredit: 1200,
            yearlyCredit: 14400, // 1200 * 12
            monthlyPlanId: "plan_QZrnHENcbpA1xP",
            yearlyPlanId: "plan_QhRBCcX73kTS7P", // Add your yearly plan ID
            description: 'Everything you need for enterprise-level content',
            features: ['Credits per month', 'Everything in PRO plan, plus:', 'Exclusive support for large projects', "API & custom integrations"],
        }
    ];

    const faqs = [
        {
            question: "Can I cancel my plan?",
            answer: "Yes. You can cancel your plan anytime via settings. Your plan will remain active until the end of the billing cycle."
        },
        {
            question: "How do I view how many credits I have left?",
            answer: "You can view your usage in settings by clicking your profile picture in the top right corner."
        },
        {
            question: "Can I change my plan after I subscribe?",
            answer: "Yes. You can upgrade or downgrade your plan at any time by visiting account settings."
        },
        {
            question: "Do you have a refund policy?",
            answer: "Unfortunately, we do not offer refunds. You can cancel your plan anytime and your plan will remain active until the end of the billing cycle."
        },
        {
            question: "Can I monetize videos created with Cravio?",
            answer: "Yes. You fully own the rights to all videos. "
        }
    ];

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const handleSubscribe = async (plan: PricingPlan) => {
        setLoading(true);
        const planId = isYearly ? plan.yearlyPlanId : plan.monthlyPlanId;
        const credits = isYearly ? plan.yearlyCredit : plan.monthlyCredit;
        const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

        // Use different API endpoints for monthly vs yearly
        const apiEndpoint = isYearly
            ? 'https://cravio-ai.onrender.com/create-yearly-subscription'
            : 'https://cravio-ai.onrender.com/create-monthly-subscription';

        const res = await fetch(apiEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                plan_id: planId,
            })
        });

        const data = await res.json();

        const options: RazorpayOptions = {
            key: "rzp_live_UEdAvXjUa5ylU2",
            subscription_id: data.id,
            name: "Cravio AI",
            description: "AI Video Subscription",
            theme: {
                color: "#6366f1"
            },
            handler: async function (response: RazorpayResponse) {
                // Send request to the server to update the user's credits
                try {
                    const userRes = await fetch('https://cravio-ai.onrender.com/update-credits', {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            user_email: user?.primaryEmailAddress?.emailAddress,
                            credits: credits,
                            subscription_id: data.id,
                            price: Math.round(price),
                            billing_cycle: isYearly ? 'yearly' : 'monthly',
                            plan_name: plan.name,
                            status: "active",
                            last_credited: new Date().toISOString()
                        })
                    });

                    const userData = await userRes.json();
                    console.log("success", userData);
                    console.log("response", response);
                    toast.success("Thanks for Subscribing us");

                    if (typeof window !== 'undefined' && window.fbq) {
                        window.fbq('track', 'Purchase', {
                            value: Math.round(price),
                            currency: 'USD',
                            content_name: `${plan.name} - ${isYearly ? 'Yearly' : 'Monthly'}`,
                            content_category: 'Subscription',
                            content_type: 'product',
                        });
                    }

                    setLoading(false);
                    // delay 3 sec then router.push("/admin/dashboard")
                    setTimeout(() => {
                        router.push("/admin/dashboard");
                    }, 3000);
                } catch (error) {
                    console.error(error);
                    setLoading(false);
                }
            },
            prefill: {
                name: "Your Name",
                email: user?.primaryEmailAddress?.emailAddress || ''
            },
        };

        const razor = new ((window as unknown) as RazorpayWindow).Razorpay(options);
        razor.open();
        setLoading(false);
    };

    const toggleMobileTip = () => {
        // Only show tooltip on small screens
        if (window.innerWidth < 768) {
            setShowMobileTip(!showMobileTip);
        }
    };

    const getCurrentPrice = (plan: PricingPlan) => {
        return isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    };

    const getCurrentCredits = (plan: PricingPlan) => {
        return isYearly ? plan.yearlyCredit : plan.monthlyCredit;
    };

    return (
        <div className="container mx-auto py-16 px-4 md:px-6">
            <Toaster />
            <motion.div
                className="text-center mb-16"
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Upgrade Your Plan</h1>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center mb-8">
                    <div className="bg-zinc-800 p-1 rounded-lg flex items-center">
                        <button
                            onClick={() => setIsYearly(false)}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                !isYearly
                                    ? "bg-black text-white shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-700 "
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsYearly(true)}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2",
                                isYearly
                                    ? "bg-black text-white shadow-sm"
                                    : "text-zinc-500  hover:text-zinc-700"
                            )}
                        >
                            Yearly
                            <span className="bg-gradient-to-r from-red-600 to-yellow-500 text-white rounded font-medium px-2 py-1">
                                Save 50% off
                            </span>
                        </button>
                    </div>
                </div>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
                {pricingPlans.map((plan, index) => (
                    <motion.div
                        key={plan.name}
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={cn(
                            plan.highlight && "md:-mt-4 md:mb-4"
                        )}
                    >
                        <Card className={cn(
                            "relative overflow-hidden h-full",
                            plan.highlight ? "border-2 border-red-500 shadow-xl" : ""
                        )}>
                            {plan.highlight && (
                                <div className="absolute top-0 right-0 bg-gradient-to-r from-red-600 to-yellow-500 text-white px-3 py-1 rounded-bl-lg text-sm font-medium">
                                    MOST POPULAR
                                </div>
                            )}
                            <CardHeader className={cn(
                                plan.highlight ? "pb-6" : ""
                            )}>
                                <CardTitle className={cn(
                                    "text-xl text-center",
                                    plan.highlight ? "text-2xl bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent" : ""
                                )}>
                                    {plan.name}
                                </CardTitle>
                                <CardDescription className="text-center">{plan.description}</CardDescription>
                                <div className="mt-4 text-center">
                                    <span className={cn(
                                        "text-4xl font-bold",
                                        plan.highlight ? "text-5xl" : ""
                                    )}>
                                        ${getCurrentPrice(plan)}
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                                        /{isYearly ? 'month' : 'month'}
                                    </span>
                                    {isYearly && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Billed annually (${(getCurrentPrice(plan) * 12).toFixed(1)}/year)
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {plan.features.map((feature, i) => (
                                        <div className="flex items-center gap-2" key={i}>
                                            <li className="flex items-center">
                                                <Check className={cn(
                                                    "h-5 w-5 mr-2 flex-shrink-0",
                                                    plan.highlight ? "text-orange-500" : "text-yellow-500"
                                                )} />
                                                <span>
                                                    {feature === 'Credits per month'
                                                        ? `${getCurrentCredits(plan).toLocaleString()} Credits${isYearly ? ' per year, available instantly' : ' per month, available instantly'}`
                                                        : feature
                                                    }
                                                </span>
                                            </li>
                                            {feature.includes("Credits") && (
                                                <TooltipProvider>
                                                    <Tooltip open={showMobileTip || undefined}>
                                                        <TooltipTrigger asChild>
                                                            <Info
                                                                className="w-4 h-4 text-zinc-400 cursor-pointer"
                                                                onClick={toggleMobileTip}
                                                            />
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            <p>1 credit = 1 min video processing</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={() => handleSubscribe(plan)}
                                    disabled={loading}
                                    className={cn(
                                        "w-full flex items-center justify-center gap-2",
                                        plan.highlight
                                            ? "bg-gradient-to-r from-red-600 to-yellow-500 hover:from-red-500 hover:to-yellow-400 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20 text-lg py-6"
                                            : ""
                                    )}
                                >
                                    {loading ? (
                                        <>
                                            <svg
                                                className="animate-spin h-5 w-5 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                                ></path>
                                            </svg>
                                        </>
                                    ) : (
                                        plan.highlight ? "SUBSCRIBE NOW" : "SUBSCRIBE"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <motion.div
                className="max-w-3xl mx-auto"
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-2">Frequently asked questions</h2>
                    <p className="text-gray-500 dark:text-gray-400">Still have questions? Can&apos;t find the answer you&apos;re looking for?</p>
                </div>

                <Accordion type="single" collapsible className="mb-12">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-left">
                                <div className="flex items-center">
                                    <HelpCircle className="h-5 w-5 mr-2 text-zinc-400" />
                                    {faq.question}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pl-7">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>

                <div className="p-6 rounded-lg text-center border">
                    <h3 className="text-xl font-semibold mb-2">Please chat to our friendly team</h3>
                    <p className="mb-4">We&apos;re here to help with any questions you might have.</p>
                    <a href="mailto:cravio.ai@gmail.com">
                        <Button className="flex items-center">
                            <MessageSquare className="h-5 w-5 mr-2" />
                            Get in touch
                        </Button>
                    </a>
                </div>
            </motion.div>
        </div>
    );
};

export default Plans;