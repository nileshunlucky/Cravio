"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

type ContentItem = {
  id: string;
  prompt: string;
  script: string;
  caption: string;
  virality_score: number;
  content_url: string;
  created_at: string;
};

const PortfolioPage = () => {
  const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || '';
  const [userContent, setUserContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!email) return;

      try {
        const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`);
        const data = await res.json();

        if (res.ok) {
          setUserContent(data.content || []);
        } else {
          console.error("Error from server:", data);
          toast.error("Failed to load user data", {
            style: {
              background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
              color: "white",
              border: "0px"
            }
          });
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        toast.error("Failed to load data", {
          style: {
            background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
            color: "white",
            border: "0px"
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [email]);

  if (loading) {
    return <p className="text-center mt-10 text-lg">Loading your portfolio...</p>;
  }

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Portfolio</h1>
      {userContent.length === 0 ? (
        <p className="text-zinc-400">No content yet. Start creating something amazing!</p>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {userContent.map(item => (
            <motion.div
              key={item.id}
              layout
              whileHover={{ scale: 1.02 }}
              className="break-inside-avoid"
            >
              <Dialog>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:shadow-xl transition-shadow duration-300">
                    <CardContent>
                      <CardTitle className="text-lg font-semibold line-clamp-2">{item.prompt}</CardTitle>
                      <CardDescription className="text-zinc-400 line-clamp-3">{item.caption}</CardDescription>
                      <p className="mt-2 text-sm text-zinc-500">Virality: {item.virality_score}</p>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{item.prompt}</DialogTitle>
                    <DialogDescription>{item.caption}</DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <video
                      src={item.content_url}
                      controls
                      className="w-full rounded-md shadow-md"
                    />
                    <p className="mt-2 text-sm text-zinc-500">Script: {item.script}</p>
                    <p className="mt-1 text-sm text-zinc-500">Virality Score: {item.virality_score}</p>
                    <p className="mt-1 text-sm text-zinc-400">Created at: {new Date(item.created_at).toLocaleString()}</p>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;
