"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Achievement {
  title: string;
  image_url: string;
  summary: {
    overall_assessment: string;
    nutrition_plan: string;
    skincare_routine: string;
    daily_routine: DailyRoutineItem[];
  };
  created_at: string;
}

interface DailyRoutineItem {
  Time: string;
  Action: string;
  Summary: string;
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
          setAchievements(data?.achievements?.slice()?.reverse() || []);
          console.log("Fetched achievements:", data?.achievements);
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
    return <p className="text-center mt-10 text-zinc-400">No achievements yet.</p>;
  }

  return (
    <div className="p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {achievements.map((ach, idx) => (
        <motion.div
          key={idx}
          whileHover={{ scale: 1.03 }}
          className="bg-black rounded-2xl shadow-lg overflow-hidden"
        >
          <Card className="border-none shadow-none">
            <CardContent className="p-4">
              <img
                src={ach.image_url}
                alt={ach.image_url}
                className="w-48 h-48 object-cover rounded-full mb-4 mx-auto"
              />

              {/* Summary Table */}
<div className="w-full overflow-x-auto">
  <table className="w-full text-left border-collapse">
    <tbody>
      <tr className="border-b border-white/20">
        <td className="py-2 font-semibold text-zinc-300">Overall</td>
        <td className="py-2 text-white">{ach.summary.overall_assessment}</td>
      </tr>
      <tr className="border-b border-white/20">
        <td className="py-2 font-semibold text-zinc-300">Nutrition Plan</td>
        <td className="py-2 text-white">{ach.summary.nutrition_plan}</td>
      </tr>
      <tr className="border-b border-white/20">
        <td className="py-2 font-semibold text-zinc-300">Skincare Routine</td>
        <td className="py-2 text-white">{ach.summary.skincare_routine}</td>
      </tr>
      <tr>
        <td className="py-2 font-semibold text-zinc-300">Daily Routine</td>
        <td className="py-2 text-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-white/20 rounded-lg">
              <thead>
                <tr className="bg-zinc-800 text-white">
                  <th className="py-2 px-3 text-left">Time</th>
                  <th className="py-2 px-3 text-left">Action</th>
                  <th className="py-2 px-3 text-left">Summary</th>
                </tr>
              </thead>
              <tbody>
                  {ach?.summary?.daily_routine?.map((item: DailyRoutineItem, idx: number) => (
                  <tr key={idx} className="border-b border-white/20 hover:bg-zinc-900">
                    <td className="py-2 px-3">{item.Time}</td>
                    <td className="py-2 px-3">{item.Action}</td>
                    <td className="py-2 px-3">{item.Summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>

            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default AchievementsPage;
