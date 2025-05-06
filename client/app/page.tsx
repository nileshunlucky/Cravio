"use client";

import Features from '@/components/Features'
import Footer from '@/components/Footer'
import Monitize from '@/components/Monitize'
import Nav from '@/components/Nav'
import Review from '@/components/Review'
import React from 'react'
import dynamic from 'next/dynamic';
const Hero = dynamic(() => import('@/components/Hero'), {
  ssr: false,
});

const page = () => {
  return (
    <div>
      <Nav/>
      <Hero/>
      <Features/>
      <Monitize/>
      <Review/>
      <Footer/>
    </div>
  )
}

export default page
