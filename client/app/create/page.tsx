"use client";

import React from "react";
import { useRouter } from "next/navigation";

type Feature = {
  id: string;
  title: string;
  href: string;
  img?: string;
  video?: string;
};

const features: Feature[] = [
  {
    id: "canvas",
    title: "Canvas",
    href: "/admin/canvas",
    img: "https://higgsfield.ai/_next/image?url=https%3A%2F%2Fdqv0cqkoy5oj7.cloudfront.net%2Fuser_2vtxM3DRcDcQIjpmiCpUDF2wcAT%2Fc16718f6-b134-4f99-ad1d-737e83c0df5a.png&w=240&q=75",
  },
  {
    id: "opus",
    title: "Opus",
    href: "/admin/opus",
    video: "https://res.cloudinary.com/dxpydoteo/video/upload/v1758266840/image_pe3wl2.mp4",
  },
  {
    id: "personas",
    title: "Persona",
    href: "/admin/personas",
    img: "https://i.pinimg.com/736x/ff/a9/d7/ffa9d7bbf64e91260778fe572018637a.jpg",
  },
  {
    id: "portfolio",
    title: "Portfolio",
    href: "/admin/portfolio",
    img: "https://i.pinimg.com/1200x/59/9c/96/599c96a5a4a566971cafab2f6a9fed81.jpg",
  },
];

export default function AdminFeaturesPage() {
  const router = useRouter();

  return (
    <div className="p-3 md:p-7 mb-12 md:mb-0">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
        {features.map((feature) => (
          <div
            key={feature.id}
            onClick={() => router.push(feature.href)}
            className="relative cursor-pointer overflow-hidden rounded-lg"
            style={{ aspectRatio: "16/10" }}
          >
            {/* Media */}
            {feature.video ? (
              <video
                src={feature.video}
                className="w-full h-full object-cover"
                muted
                loop
                autoPlay
              />
            ) : (
              <img
                src={feature.img}
                alt={feature.title}
                className="w-full h-full object-cover transition-transform duration-500 ease-out hover:scale-105"
                style={{ filter: "brightness(0.7) contrast(1.1) saturate(0.9)" }}
              />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 hover:opacity-60 transition-opacity duration-300" />
            <div className="absolute inset-0 border border-white/10 hover:border-white/30 transition-colors duration-300" />

            {/* Title */}
            <div className="absolute inset-0 flex items-end p-4">
              <h3 className="text-xl md:text-4xl font-light tracking-widest text-white">
                {feature.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
