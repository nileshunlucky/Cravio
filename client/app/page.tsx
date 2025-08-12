"use client";

import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import Review from '@/components/Review'
import HeroX from '@/components/HeroX'
import React from 'react'
import Features from '@/components/Features'
import Caption from '@/components/Caption'
import DevilExplore from '@/components/DevilExplore'

const page = () => {
  return (
    <div className='overflow-hidden'>
      <Nav/>
      <HeroX/>
      <Features/>
      <DevilExplore/>
      <Caption/>
      <Review/>
      <Footer/>
    </div>
  )
}

export default page
