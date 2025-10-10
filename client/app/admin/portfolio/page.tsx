"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

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
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
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
          toast.error("Failed to load user data");
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [email]);

  return (
    <div className="px-4 md:px-8 py-10 max-w-[1400px] mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
          My Portfolio
        </h1>
        {!loading && userContent.length > 0 && (
          <p className="text-zinc-500 text-sm md:text-base">
            {userContent.length} {userContent.length === 1 ? "Item" : "Items"}
          </p>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-md"
            >
              {/* Media block skeleton */}
              <Skeleton className="w-full aspect-[9/16] bg-zinc-800" />

              <div className="p-4 space-y-3">
                {/* Title line */}
                <Skeleton className="h-5 w-3/4 bg-zinc-800 rounded-md" />
                {/* Caption lines */}
                <Skeleton className="h-4 w-full bg-zinc-800 rounded-md" />
                <Skeleton className="h-4 w-5/6 bg-zinc-800 rounded-md" />
                {/* Footer line */}
                <Skeleton className="h-3 w-1/3 bg-zinc-800 rounded-md mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : userContent.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[40vh] text-center">
          <p className="text-zinc-400 text-lg">No content yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {userContent.map((item) => (
            <motion.div
              key={item.id}
              layout
              whileHover={{ scale: 1.015 }}
              transition={{ type: "spring", stiffness: 250, damping: 20 }}
            >
              <Dialog>
                <DialogTrigger asChild>
                  <Card className="group cursor-pointer overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-md transition-all hover:border-zinc-700">
                    <div className="relative aspect-[9/16] overflow-hidden bg-zinc-900">
                      <video
                        src={item.content_url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    </div>
                    <CardContent className="p-4">
                      <CardTitle className="text-base font-medium text-white line-clamp-2 mb-1 group-hover:text-zinc-200 transition-colors">
                        {item.prompt}
                      </CardTitle>
                      <CardDescription className="text-zinc-400 text-sm line-clamp-2 mb-2">
                        {item.caption}
                      </CardDescription>
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span>Virality: {item.virality_score}</span>
                        <span>
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>

                <DialogContent className="sm:max-w-3xl bg-zinc-950/95 backdrop-blur-xl border border-zinc-800">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-medium text-white">
                      {item.prompt}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      {item.caption}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <video
                      src={item.content_url}
                      controls
                      className="w-full rounded-xl border border-zinc-800 shadow-md"
                    />
                    <div className="mt-4 space-y-1 text-sm text-zinc-400">
                      <p>
                        <span className="font-medium text-white">Script:</span>{" "}
                        {item.script}
                      </p>
                      <p>
                        <span className="font-medium text-white">
                          Virality Score:
                        </span>{" "}
                        {item.virality_score}
                      </p>
                      <p>
                        <span className="font-medium text-white">
                          Created at:
                        </span>{" "}
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
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
