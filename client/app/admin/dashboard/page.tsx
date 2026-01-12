"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { useUser } from '@clerk/nextjs';


type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const Page = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Added loading state
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Handle auto-growing textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!email) {
      console.error("email not found!");
      return;
    }

    const userMsg = { id: Date.now().toString(), role: 'user', content: input };
    
    // 1. Update UI
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // 2. Prepare FormData
      const formData = new FormData();
      formData.append('email', email);
      formData.append('input', currentInput);
      console.log(email, currentInput)

      // 3. Connect to real API
      const response = await fetch('https://cravio-ai.onrender.com/chatbot', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      console.log(data)

      // 4. Add assistant reply to state
      const botMsg = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: data.reply 
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans selection:bg-zinc-800">
      
      {/* --- Chat Container --- */}
      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 space-y-6 pt-12 pb-40 no-scrollbar"
      >
        <div className="max-w-2xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-[85%] px-5 py-3 rounded-[24px] text-[15px] leading-relaxed tracking-tight
                  ${msg.role === 'user' 
                    ? 'bg-zinc-900 text-zinc-200 border border-zinc-800/50' 
                    : 'bg-[#c3002b] text-white font-medium'}
                `}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex justify-start"
              >
               <span className="relative flex size-4">
  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c3002b] opacity-75"></span>
  <span className="relative inline-flex size-4 rounded-full bg-[#c3002b]"></span>
</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* --- Fixed Bottom Input Area --- */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent">
        <div className="max-w-2xl mx-auto relative flex items-end">
          <textarea 
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Mellvitta"
            className="w-full bg-zinc-900 text-zinc-100 rounded-[26px] py-4 pl-6 pr-14 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all placeholder:text-zinc-500 border border-zinc-800/50 resize-none min-h-[56px] overflow-y-auto no-scrollbar"
          />
          
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-2 bg-white text-black rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-200 transition-all"
          >
            <ArrowUp size={20} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Page