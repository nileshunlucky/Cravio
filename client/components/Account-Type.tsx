"use client";

import { useState , useEffect} from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import {
  useUser,
} from '@clerk/nextjs'

export default function AccountPrivacyToggle() {
  const [isPrivate, setIsPrivate] = useState(false);
  const [account, setAccount] = useState<string | null>(null)
  const { user } = useUser()

  // Fetch user account value
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.emailAddresses?.[0]?.emailAddress) return
      try {
        const res = await fetch(
          `https://cravio-ai.onrender.com/user/${user.emailAddresses[0].emailAddress}`
        )
        if (!res.ok) return
        const data = await res.json()
        setAccount(data.account)
      } catch (err) {
        console.error('Failed to fetch user data:', err)
      }
    }
    fetchUserData()
  }, [user])

  return (
    <div className="w-full border-b border-zinc-700  flex items-center justify-between py-4 px-6 md:px-20">
      {/* Left side label */}
              <motion.span
          key={isPrivate ? "Private" : "Public"}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          className="text-sm font-medium"
        >
          {account}
        </motion.span>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <Switch
          checked={isPrivate}
          onCheckedChange={setIsPrivate}
          className="data-[state=checked]:bg-zinc-800"
        />
      </div>
    </div>
  );
}
