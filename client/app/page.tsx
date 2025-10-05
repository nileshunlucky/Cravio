"use client";

import Hero from '@/components/Hero'
import Hero1 from '@/components/Hero1'
import Hero2 from '@/components/Hero2'
import HeroGsap from '@/components/HeroGsap'
import Footer from '@/components/Footer'
import React from 'react'
import Navbar from '@/components/navbar'


const page = () => {
  return (
    <div >
    <Navbar/>
    <Hero/>
    <Hero1/>
    <Hero2/>
    <HeroGsap/>
    <Footer/>
    </div>
  )
}

export default page
