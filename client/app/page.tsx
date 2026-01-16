"use client";

import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import Review from '@/components/Review'
import FAQ from '@/components/FAQ'
import Hero from '@/components/Hero'
import React from 'react'
import Anything from '@/components/Anything';

const page = () => {
  return (
    <div className='overflow-hidden'>
      <Nav/>
      <Hero/>
      <Anything/>
      <Review/>
      <FAQ/>
      <Footer/>
    </div>
  )
}

export default page
