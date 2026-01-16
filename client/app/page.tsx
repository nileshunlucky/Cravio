"use client";

import Footer from '@/components/Footer'
import Monitize from '@/components/Monitize'
import Nav from '@/components/Nav'
import Review from '@/components/Review'
import HeroX from '@/components/HeroX'
import React from 'react'
import Anything from '@/components/Anything';

const page = () => {
  return (
    <div className='overflow-hidden'>
      <Nav/>
      <HeroX/>
      <Anything/>
      <Monitize/>
      <Review/>
      <Footer/>
    </div>
  )
}

export default page
