"use client"

import React, {useEffect} from 'react'
import SendEmailToBackend  from "@/components/SendEmailToBackend"
import { SignedIn } from "@clerk/nextjs"
import Navbar from "@/components/Navbar"

const page = () => {
    // get user request /user/{email}
    useEffect(() => {
        const fetchUser = async () => {
            const response = await fetch('/api/user', {
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

export default page
