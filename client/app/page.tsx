"use client";

import Footer from '@/components/Footer'
import Monitize from '@/components/Monitize'
import Nav from '@/components/Nav'
import Review from '@/components/Review'
import HeroX from '@/components/HeroX'
import React from 'react'
// import dynamic from 'next/dynamic';
// const Hero = dynamic(() => import('@/components/Hero'), {
//   ssr: false,
// });

const page = () => {
  return (
    <div>
      <Nav/>
      <HeroX/>
      <Monitize/>
      <Review/>
      <Footer/>
    </div>
  )
}

export default page
