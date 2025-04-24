import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import Monitize from '@/components/Monitize'
import Nav from '@/components/Nav'
import Review from '@/components/Review'
import React from 'react'

const page = () => {
  return (
    <div>
      <Nav/>
      <Hero/>
      <Monitize/>
      <Review/>
      <Footer/>
    </div>
  )
}

export default page
