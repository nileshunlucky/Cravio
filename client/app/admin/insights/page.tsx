"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Achievement {
  title: string;
  image_url: string;
  summary: {
    workout_plan: string;
    diet: string;
    routine: string;
  };
  created_at: string;
}

const AchievementsPage = () => {
  const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  const [achievements, setAchievements] = useState<Achievement[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!email) return;

      try {
        const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`);
        const data = await res.json();

        if (res.ok) {
          setAchievements(data.achievements.slice().reverse() || []);
          console.log("Fetched achievements:", data.achievements);
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

    fetchAchievements();
  }, [email]);

  if (loading) {
    return (
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, idx) => (
          <Skeleton key={idx} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!achievements || achievements.length === 0) {
    return <p className="text-center mt-10 text-gray-400">No achievements yet.</p>;
  }

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {achievements.map((ach, idx) => (
        <motion.div
          key={idx}
          whileHover={{ scale: 1.03 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden"
        >
          <Card className="border-none shadow-none">
            <CardContent className="p-4">
              <CardTitle className="text-lg font-semibold mb-3">{ach.title}</CardTitle>
              <img
                src={ach.image_url}
                alt={ach.title}
                className="w-full h-48 object-cover rounded-xl mb-4"
              />
              <CardDescription>
                <p className="mb-2"><span className="font-semibold text-white">Workout Plan:</span> {ach.summary.workout_plan}</p>
                <p className="mb-2"><span className="font-semibold text-white">Diet:</span> {ach.summary.diet}</p>
                <p className="mb-2"><span className="font-semibold text-white">Routine:</span> {ach.summary.routine}</p>
              </CardDescription>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default AchievementsPage;
