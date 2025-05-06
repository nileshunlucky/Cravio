"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, HelpCircle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useUser } from '@clerk/clerk-react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

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
  price: number;
  description: string;
  features: string[];
  videos: number;
  highlight?: boolean;
  credit: number;
  planId: string;
}

const Plans: React.FC = () => {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false)
  const pricingPlans: PricingPlan[] = [
    {
      name: 'BASIC',
      price: 9.99,
      credit: 250,
      planId: "plan_QLjO4aUd0kgvdx",
      description: 'Perfect for beginners and small projects',
      features: ['250 Credits', 'HD resolution', 'Email support'],
      videos: 25
    },
    {
      name: 'PRO',
      price: 24.9,
      credit: 700,
      planId: "plan_QLjOSlbc9e8LUs",
      description: 'Ideal for professionals and growing businesses',
      features: ['700 Credits', '4K resolution', 'Priority email & chat support'],
      videos: 70,
      highlight: true
    },
    {
      name: 'PREMIUM',
      price: 49.9,
      credit: 1500,
      planId: "plan_QLjOiOlriagyoQ",
      description: 'Everything you need for enterprise-level content',
      features: ['1500 Credits', '4K resolution', '24/7 priority support',],
      videos: 150
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
      question: "What is an AI video credit?",
      answer: "An AI video is a video auto-edited by Cravio AI. We currently generate Story and ChatGPT videos."
    },
    {
      question: "Can I monetize videos created with Cravio?",
      answer: "Yes. You fully own the rights to all videos. We use custom recorded gameplay to ensure originality."
    }
  ];

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const handleSubscribe = async (planId: string) => {
    setLoading(true)
    const res = await fetch('https://cravio-ai.onrender.com/create-subscription', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ plan_id: planId })
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
              credits: pricingPlans.find(plan => plan.planId === planId)?.credit,
              subscription_id: data.id,
              price: Math.round(pricingPlans.find(plan => plan.planId === planId)?.price || 0),
              status: "active",
              last_credited: new Date().toISOString()
            })
          });

          const userData = await userRes.json();
          console.log("success", userData)
          console.log("response", response)
          toast.success("Thanks for Subscribing us")
          setLoading(false)
          // deplay 3 sec then router.push("/admin/dashboard")
          setTimeout(() => {
            router.push("/admin/dashboard")
          }, 3000);
        } catch (error) {
          console.error(error)
          setLoading(false)
        }
      },
      prefill: {
        name: "Your Name",
        email: user?.primaryEmailAddress?.emailAddress || ''
      },
    };

    const razor = new ((window as unknown) as RazorpayWindow).Razorpay(options);
    razor.open();
    setLoading(false)
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
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Create stunning AI-powered videos for your business with our flexible subscription plans.
        </p>
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
              plan.highlight ? "border-2 border-blue-500  shadow-xl" : ""
            )}>
              {plan.highlight && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-bl-lg text-sm font-medium">
                  MOST POPULAR
                </div>
              )}
              <CardHeader className={cn(
                plan.highlight ? "pb-6" : ""
              )}>
                <CardTitle className={cn(
                  "text-xl text-center",
                  plan.highlight ? "text-2xl text-blue-600" : ""
                )}>
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-center">{plan.description}</CardDescription>
                <div className="mt-4 text-center">
                  <span className={cn(
                    "text-4xl font-bold",
                    plan.highlight ? "text-5xl text-blue-600" : ""
                  )}>
                    ${plan.price}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className={cn(
                  "font-semibold mb-4 text-center",
                  plan.highlight ? "text-lg" : ""
                )}>
                  {plan.videos} AI videos per month
                </p>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className={cn(
                        "h-5 w-5 mr-2 flex-shrink-0",
                        plan.highlight ? "text-blue-500" : "text-green-500"
                      )} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleSubscribe(plan.planId)}
                  disabled={loading}
                  className={cn(
                    "w-full flex items-center justify-center gap-2",
                    plan.highlight
                      ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20 text-lg py-6"
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
                  <HelpCircle className="h-5 w-5 mr-2 text-blue-500" />
                  {faq.question}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-7">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className=" p-6 rounded-lg text-center border">
          <h3 className="text-xl font-semibold mb-2">Please chat to our friendly team</h3>
          <p className="mb-4">We&apos;re here to help with any questions you might have.</p>
          <a href="mailto:cravio.ai@gmail.com"><Button className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Get in touch
          </Button></a>
        </div>
      </motion.div>
    </div>
  );
};

export default Plans;