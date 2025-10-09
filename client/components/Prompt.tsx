"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

const Prompt = () => {
  const [prompt, setPrompt] = useState("");
  const [isTall, setIsTall] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_ROWS = 8; 
  const LINE_HEIGHT = 24; 

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; 
      const maxHeight = MAX_ROWS * LINE_HEIGHT;
      const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;

      setIsTall(newHeight > LINE_HEIGHT * 2);
    }
  }, [prompt]);

  const handleSend = () => {
    if (!prompt.trim()) return;
    console.log("Prompt submitted:", prompt);
    setPrompt("");
  };
  
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-4 left-0 right-0 flex justify-center px-4 sm:px-0"
    >
      <div
        className={`relative flex bg-zinc-900 shadow-lg px-4 w-full max-w-[95%] md:max-w-3xl transition-all duration-200 ${
          isTall ? "rounded-2xl" : "rounded-full"
        }`}
      >
        <textarea
          ref={textareaRef}
          placeholder="Describe idea..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex-1 resize-none border-none focus:ring-0 bg-transparent placeholder:text-zinc-500 py-3 md:py-4 text-base sm:text-lg md:text-xl focus:outline-none  leading-[24px]"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={!prompt.trim()} 
          className={`absolute right-2 md:right-3 bg-white p-3 md:p-4 rounded-full hover:opacity-90 transition-all duration-200 ${
            isTall ? "bottom-2" : "top-1/2 -translate-y-1/2"
          }`}
        >
          <ArrowUp className="w-5 h-5 md:w-6 md:h-6 text-black" />
        </Button>
      </div>
    </motion.div>
  );
};

export default Prompt;
