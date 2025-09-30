"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Page = () => {
  const cardsContainerRef = useRef<HTMLElement | null>(null);
  const card1Ref = useRef<HTMLDivElement | null>(null);
  const card2Ref = useRef<HTMLDivElement | null>(null);
  const card3Ref = useRef<HTMLDivElement | null>(null);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // Mouse parallax
  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth < 768);
    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", updateIsMobile);
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cardsContainerEl = cardsContainerRef.current;
      const c1 = card1Ref.current;
      const c2 = card2Ref.current;
      const c3 = card3Ref.current;

      if (!cardsContainerEl || !c1 || !c2 || !c3) {
        return;
      }

      // Floating cards animation
      gsap.to(c1, { y: -25, duration: 4, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.to(c2, { y: -35, duration: 5.5, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.to(c3, { y: -20, duration: 4.5, ease: "sine.inOut", yoyo: true, repeat: -1 });

      // Scroll-triggered card spread
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: cardsContainerEl,
          pin: true,
          scrub: 1,
          start: "top top",
          end: "+=2500",
        },
      });

      tl.from(c1, { x: "-220%", ease: "power2.inOut" }, "align")
        .from(c3, { x: "110%", ease: "power2.inOut" }, "align")
        .from(c2, { scale: 0.9, ease: "power2.inOut" }, "align");
    });

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div className="overflow-x-hidden">
      <main className="relative z-10">
        {/* CARDS */}
        <section ref={cardsContainerRef} className="h-screen flex items-center justify-center">
          <div className="relative w-[280px] md:w-[400px] h-[520px] md:h-[480px]">
            {/* Left Card */}
            <div
              ref={card1Ref}
              className="absolute w-[220px] md:w-[320px] h-[180px] md:h-full bg-white/5 backdrop-blur-xl rounded-3xl  shadow-2xl left-1/2 top-1/2 -translate-x-[50%] -translate-y-[45%] md:left-1/2 md:-translate-x-[130%] md:top-1/2 md:-translate-y-1/2 z-20"
              style={{
                transform: isMobile
                  ? `translateX(${mousePosition.x * 0.3}px) translateY(${mousePosition.y * 0.3}px)`
                  : `translateX(calc(-130% + ${mousePosition.x * 0.5}px)) translateY(calc(-50% + ${mousePosition.y * 0.5}px))`,
                transition: 'transform 0.3s ease-out',
              }}
            >
              <img src="https://higgsfield.ai/_next/image?url=https%3A%2F%2Fdqv0cqkoy5oj7.cloudfront.net%2Fuser_2vtxM3DRcDcQIjpmiCpUDF2wcAT%2Fce2024c0-22b8-401b-9f81-cb3897b7753f.png&w=240&q=75" alt="AI Brain" className="w-full h-full object-cover rounded-2xl mb-4" />
            </div>

            {/* Center Card */}
            <div
              ref={card2Ref}
              className="absolute w-[240px] md:w-full h-[220px] md:h-full bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-30"
              style={{
                transform: isMobile
                  ? `translateX(calc(-50% + ${mousePosition.x * 0.2}px)) translateY(calc(-68% + ${mousePosition.y * 0.2}px)) scale(1.12)`
                  : `translateX(calc(-50% + ${mousePosition.x * 0.2}px)) translateY(calc(-50% + ${mousePosition.y * 0.2}px)) scale(1.05)`,
                transition: 'transform 0.3s ease-out',
              }}
            >
              <img src="https://higgsfield.ai/_next/image?url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fcontent_user_id%2F92367f61-67b3-42b1-b892-4f49771e2fc7.jpeg&w=240&q=75" alt="Premium" className="w-full h-full object-cover rounded-2xl mb-4" />
            </div>

            {/* Right Card */}
            <div
              ref={card3Ref}
              className="absolute w-[220px] md:w-[320px] h-[180px] md:h-full bg-white/5 backdrop-blur-xl rounded-3xl  shadow-2xl right-4 bottom-8 md:left-1/2 md:translate-x-[30%] md:top-1/2 md:-translate-y-1/2"
              style={{
                transform: isMobile
                  ? `translateX(${mousePosition.x * -0.3}px) translateY(${mousePosition.y * 0.3}px)`
                  : `translateX(calc(30% + ${mousePosition.x * -0.5}px)) translateY(calc(-50% + ${mousePosition.y * 0.5}px))`,
                transition: 'transform 0.3s ease-out',
              }}
            >
              <img src="https://higgsfield.ai/_next/image?url=https%3A%2F%2Fdqv0cqkoy5oj7.cloudfront.net%2Fuser_2zGhKQBhNr4agrkbTBHMUGRiaSQ%2F3ed66687-e015-41fc-9a9b-7c852b44bb16.png&w=240&q=75" alt="Growth Analytics" className="w-full h-full object-cover rounded-2xl mb-4" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Page;
