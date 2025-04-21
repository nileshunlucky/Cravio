"use client"

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

const Page = () => {
  const { user } = useUser();

  useEffect(() => {
    const sendReferral = async () => {
      const refferedBy = localStorage.getItem("referrer");
      const email = user?.primaryEmailAddress?.emailAddress;

      if (email && refferedBy) {
        try {
          const res = await fetch("https://cravio-ai.onrender.com/save-referral", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, refferedBy }),
          });

          const data = await res.json();
          console.log("Referral sent:", data);
        } catch (error) {
          console.error("Failed to send referral:", error);
        }
      }
    };

    sendReferral();
  }, [user]);

  return null;
};

export default Page;
