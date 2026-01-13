"use client";

import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import Review from '@/components/Review'
import HeroX from '@/components/HeroX'
import React from 'react'
import Features from '@/components/Features';
import Packaged from '@/components/Packaged';

const page = () => {
  return (
    <div className='overflow-hidden'>
      <Nav/>
      <HeroX/>
      <Packaged/>
      <Features/>
      <Review/>
      <Footer/>
    </div>
  )
}

export default page
