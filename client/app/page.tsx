"use client";

import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import Review from '@/components/Review'
import Hero from '@/components/Hero'
import React from 'react'
import Features from '@/components/Features';
import Packaged from '@/components/Packaged';

const page = () => {
  return (
    <div className='overflow-hidden'>
      <Nav/>
      <Hero/>
      <Features/>
      <Review/>
      <Footer/>
    </div>
  )
}

export default page
