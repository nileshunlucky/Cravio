"use client";

import React from "react";
import { motion } from "framer-motion";

// Single hero config for the top video + heading
const hero = {
  banner:
    "https://res.cloudinary.com/dxpydoteo/video/upload/v1758276438/output_mopo1g.mp4",
  title: "MELLVITTA INSPIRATION",
};

// Product list
const products = [
  {
    id: 1,
    img: "https://i.pinimg.com/1200x/59/9c/96/599c96a5a4a566971cafab2f6a9fed81.jpg",
    name: "Designer Portrait Collection",
    prompt:
      "Ultra-realistic portrait of a brunette woman with long wavy layered hair in a professional studio photoshoot, wearing a black long-sleeved bodysuit with cutout details, crouching pose with confident expression looking over shoulder, black strappy high heel sandals with ankle straps, athletic feminine figure, flawless skin and natural makeup, dramatic studio lighting against neutral beige background, modern fashion photography style, sophisticated sensual aesthetic, high detail, commercial photography quality, 8K resolution",
  },
  {
    id: 2,
    img: "https://higgsfield.ai/_next/image?url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fcontent_user_id%2F8b582c1d-ca5a-4dba-9458-04e8c5c55714.jpeg&w=240&q=75",
    name: "Tokyo Street Style",
    prompt:
      "A Korean woman strides confidently through a dense Tokyo street, her sculptural leather jacket and soft-flowing scarf crisp against the chaotic hum. Harsh midday light slashes across her face, punctuated by direct flash that carves deep chiaroscuro shadows, highlighting the smooth grain of leather and the subtle pores along her jawline. Her phone is a quiet prop, sleek and luminescent in her hand, grounding the scene in modernity amid urban flux",
  },
  {
    id: 3,
    img: "https://i.pinimg.com/736x/fd/31/4c/fd314c7f38413ed0fdcffa356938ff85.jpg",
    name: "Cozy Home Collection",
    prompt:
      "Ultra-realistic portrait of a brunette woman with long layered hair sitting on a beige sectional couch, wearing an oversized gray off-shoulder sweater, white ankle socks, relaxed intimate pose with hand in hair, cozy modern living room setting with neutral beige throw blanket with fringe details, William Morris botanical art prints on white wall, natural indoor lighting, casual lifestyle photography, comfortable home aesthetic, intimate feminine mood, high detail, candid photography style, 8K resolution",
  },
  {
    id: 4,
    img: "https://res.cloudinary.com/dxpydoteo/image/upload/v1758277831/740064f6-4604-411e-9644-0e47c845f1fe.png",
    name: "Urban Art Sneaker",
    prompt:
      "A young woman stands on a sidewalk outside a building with large windows behind her. She is wearing a light blue-green zip-up jacket, a black skirt, and teal shoes. The photograph prominently features her hands with colorful, detailed nail art in bright orange, teal, dark blue, and silver shades, which are extended toward the camera in the foreground, creating a dramatic close-up effect. The image is captured in natural daylight, revealing clear shadows on the pavement and casting an even, bright illumination across the scene.",
  },
];

export default function Page() {
  return (
    <main className="min-h-screen">
      {/* HERO VIDEO */}
      <section className="relative w-full">
        <video
          src={hero.banner}
          className="w-full h-[60vh] md:h-[70vh] object-cover"
          muted
          loop
          autoPlay
        />
      </section>

      {/* HERO TITLE */}
      <section className="text-center py-12 px-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-2xl md:text-3xl font-normal tracking-wide"
        >
          {hero.title}
        </motion.h1>
      </section>

      {/* PRODUCT GRID */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {products.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="relative mb-4 overflow-hidden rounded-xl">
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/40 to-transparent">
                  <h3 className="font-medium text-white">{item.name}</h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
