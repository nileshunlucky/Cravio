import React, {useEffect} from 'react'
import { useUser } from '@clerk/nextjs'

const page = () => {
  const { user } = useUser()
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.emailAddresses?.[0]?.emailAddress) return

      const email = user.emailAddresses[0].emailAddress

      try {
        const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`)
        const data = await res.json()

        if (res.ok) {
          console.log(data)
        } else {
          console.error("Error from server:", data)
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error)
      }
    }

    fetchUserData()
  }, [user])

  return (
    <div>
      
    </div>
  )
}

export default page
