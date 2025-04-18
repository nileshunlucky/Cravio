"use client"

import React, {useEffect} from 'react'
import SendEmailToBackend  from "@/components/SendEmailToBackend"
import { SignedIn , useUser} from "@clerk/nextjs"
import Navbar from "@/components/Navbar"

const Page = () => {
    const { user } = useUser()
    // get user request /user/{email}
    useEffect(() => {
      if (!user?.primaryEmailAddress?.emailAddress) return
      const email = user.primaryEmailAddress.emailAddress
        const fetchUser = async () => {
            const response = await fetch(`https://cravio-ai.onrender.com/user/${email}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',

                },
            });
            const data = await response.json();
            console.log(data);
        }
        fetchUser();
    }
    , []);
  return (
    <div>
              <SignedIn>
                <SendEmailToBackend />
              </SignedIn>
              <Navbar credits={100} />
    </div>
  )
}

export default Page
