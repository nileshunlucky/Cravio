"use client";

import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import Review from '@/components/Review'
import FAQ from '@/components/FAQ'
import Hero from '@/components/Hero'
import React from 'react'
import Features from '@/components/Features';

const page = () => {
  return (
    <div className='overflow-hidden'>
      <Nav/>
      <Hero/>
      <Features/>
      <Review/>
      <FAQ/>
      <Footer/>
    </div>
  )
}

export default page
