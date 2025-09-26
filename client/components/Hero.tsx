"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const products = [
  {
    id: 1,
    video: "https://res.cloudinary.com/dxpydoteo/video/upload/v1758270304/image-1_yncxqi.mp4",
    img: "https://res.cloudinary.com/dxpydoteo/image/upload/v1758271870/1bd19304-6a77-463d-b6dc-82b911095199.png",
    name: "Creator Outfit Showcase",
    prompt: "A stylish creator outfit showcase video, starting with a close-up front shot smiling confidently, then smoothly transitioning to a back view highlighting the outfit’s fit and details, filmed in clean lighting with natural movement for a trendy, premium fashion look.",
  },
  {
    id: 2,
    image: "https://higgsfield.ai/_next/image?url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fcontent_user_id%2F8b582c1d-ca5a-4dba-9458-04e8c5c55714.jpeg&w=240&q=75",
    name: "Tokyo Street Style",
    prompt: "A Korean woman strides confidently through a dense Tokyo street, her sculptural leather jacket and soft-flowing scarf crisp against the chaotic hum. Harsh midday light slashes across her face, punctuated by direct flash that carves deep chiaroscuro shadows, highlighting the smooth grain of leather and the subtle pores along her jawline. Her phone is a quiet prop, sleek and luminescent in her hand, grounding the scene in modernity amid urban flux",
  },
  {
    id: 3,
    video: "https://res.cloudinary.com/dxpydoteo/video/upload/v1758273774/red_ferrari_r2ed3g.mp4",
    img: "https://res.cloudinary.com/dxpydoteo/image/upload/v1758274034/Screenshot_2025-09-19-14-56-21-00_99c04817c0de5652397fc8b56c3b3817_wzbed3.jpg",
    name: "Ferrari Shot",
    prompt: "Start with a low-angle shot behind Model, silhouetted against dim overhead lights in a dark warehouse. He begins walking confidently toward a sleek red ferrari parked in front of a large garage door. The camera starts at ground level behind him, then performs a slow, dramatic crane up, rising smoothly to reveal more of the car and the massive space around him. Moody lighting creates sharp reflections on the polished floor. The scene should feel cinematic, intense, and powerful — like the buildup before a major event.ohwx tchnq",
  },
  {
    id: 4,
    image: "https://res.cloudinary.com/dxpydoteo/image/upload/v1758277831/740064f6-4604-411e-9644-0e47c845f1fe.png",
    name: "Urban Art Sneaker",
    prompt: "A young woman stands on a sidewalk outside a building with large windows behind her. She is wearing a light blue-green zip-up jacket, a black skirt, and teal shoes. The photograph prominently features her hands with colorful, detailed nail art in bright orange, teal, dark blue, and silver shades, which are extended toward the camera in the foreground, creating a dramatic close-up effect. The image is captured in natural daylight, revealing clear shadows on the pavement and casting an even, bright illumination across the scene.",
  },
];

export default function Page() {
  const router = useRouter();

  const handleMediaClick = (item: { id: number; name: string; prompt: string; image?: string; video?: string; img?: string }) => {
    const encodedPrompt = encodeURIComponent(item.prompt);

    if (item.image) {
      const encodedImage = encodeURIComponent(item.image);
      router.push(`/admin/canvas?prompt=${encodedPrompt}&referenceImage=${encodedImage}`);
      return;
    }

    if (item.video) {
      const preview = item.img ?? item.image ?? "";
      const encodedVideoImg = encodeURIComponent(preview);
      router.push(`/admin/opus?prompt=${encodedPrompt}${preview ? `&referenceImage=${encodedVideoImg}` : ""}`);
    }
  };

  return (
    <main className="min-h-screen">
      {/* HERO IMAGE */}
      <section className="relative w-full">
        <div className="w-full">
          <video
            src="https://res.cloudinary.com/dxpydoteo/video/upload/v1758276438/output_mopo1g.mp4"
            className="w-full h-[60vh] md:h-[70vh] object-cover"
            muted
            loop
            autoPlay
          />
        </div>
      </section>

      {/* TITLE SECTION */}
      <section className="text-center py-12 px-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-2xl md:text-3xl font-normal tracking-wide"
        >
          MELLVITTA INSPIRATION
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
              {/* Product Image */}
              <div onClick={() => handleMediaClick(item)} className="relative mb-4 overflow-hidden">
                {item.image ? (
                  <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500 rounded-xl"
                />) : (
                  <video
                    src={item.video}
                    className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500 rounded-xl"
                    muted
                    loop
                    autoPlay
                  />
                )}
              {/* Product Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 ">
                <h3 className="font-normal font-medium hover:underline transition-all">
                  {item.name}
                </h3>
              </div>
              </div>

            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}