"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Page = () => {
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const cardsContainerRef = useRef<HTMLElement | null>(null);
  const card1Ref = useRef<HTMLDivElement | null>(null);
  const card2Ref = useRef<HTMLDivElement | null>(null);
  const card3Ref = useRef<HTMLDivElement | null>(null);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Mouse parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const titleEl = titleRef.current;
      const subtitleEl = subtitleRef.current;
      const cardsContainerEl = cardsContainerRef.current;
      const c1 = card1Ref.current;
      const c2 = card2Ref.current;
      const c3 = card3Ref.current;

      if (!titleEl || !subtitleEl || !cardsContainerEl || !c1 || !c2 || !c3) {
        return;
      }

      // Hero text animation
      const titleChars = titleEl.children;
      gsap.fromTo(
        titleChars,
        { opacity: 0, y: 120, rotationX: -90, perspective: 400 },
        { opacity: 1, y: 0, rotationX: 0, duration: 1.5, stagger: 0.05, ease: "power4.out" }
      );

      gsap.fromTo(
        subtitleEl,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1.2, delay: 0.8, ease: "power3.out" }
      );

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
    <div className="bg-gradient-to-br from-[#1a140a] via-[#3a2d18] to-[#251e0e] text-white overflow-x-hidden">
      <main className="relative z-10">
        {/* HERO */}
        <section ref={heroRef} className="min-h-[120vh] flex flex-col items-center justify-center text-center px-4">
          <h1 ref={titleRef} className="text-4xl md:text-9xl font-black tracking-tighter mb-8 leading-none" style={{ perspective: 1000 }}>
            {"MELLVITTA AI".split("").map((char, i) => <span key={i} className={char === " " ? "w-4 md:w-8 inline-block" : "inline-block"}>{char}</span>)}
          </h1>
          <p ref={subtitleRef} className="md:text-xl md:text-2xl text-amber-100/60 max-w-4xl mx-auto font-light tracking-wide mb-12">
            Where creativity meets intelligence. The future of social media for visionary creators.
          </p>
        </section>

        {/* CARDS */}
        <section ref={cardsContainerRef} className="h-screen flex items-center justify-center">
          <div className="relative w-[340px] md:w-[400px] h-[300px] md:h-[480px]">
            {/* Left Card */}
            <div
              ref={card1Ref}
              className="absolute w-[320px] h-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl left-1/2 -translate-x-[130%] top-1/2 -translate-y-1/2"
              style={{
                transform: `translateX(calc(-130% + ${mousePosition.x * 0.5}px)) translateY(calc(-50% + ${mousePosition.y * 0.5}px))`,
                transition: 'transform 0.3s ease-out',
              }}
            >
              <img src="https://higgsfield.ai/_next/image?url=https%3A%2F%2Fdqv0cqkoy5oj7.cloudfront.net%2Fuser_2vtxM3DRcDcQIjpmiCpUDF2wcAT%2Fce2024c0-22b8-401b-9f81-cb3897b7753f.png&w=240&q=75" alt="AI Brain" className="w-full h-full object-cover rounded-2xl mb-4" />
            </div>

            {/* Center Card */}
            <div
              ref={card2Ref}
              className="absolute w-full h-full bg-white/10 backdrop-blur-2xl rounded-3xl border border-[#e5c88c]/40 shadow-2xl left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10"
              style={{
                transform: `translateX(calc(-50% + ${mousePosition.x * 0.2}px)) translateY(calc(-50% + ${mousePosition.y * 0.2}px)) scale(1.05)`,
                transition: 'transform 0.3s ease-out',
              }}
            >
              <img src="https://higgsfield.ai/_next/image?url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fcontent_user_id%2F92367f61-67b3-42b1-b892-4f49771e2fc7.jpeg&w=240&q=75" alt="Premium" className="w-full h-full object-cover rounded-2xl mb-4" />
            </div>

            {/* Right Card */}
            <div
              ref={card3Ref}
              className="absolute w-[320px] h-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl left-1/2 translate-x-[30%] top-1/2 -translate-y-1/2"
              style={{
                transform: `translateX(calc(30% + ${mousePosition.x * -0.5}px)) translateY(calc(-50% + ${mousePosition.y * 0.5}px))`,
                transition: 'transform 0.3s ease-out',
              }}
            >
              <img src="https://higgsfield.ai/_next/image?url=https%3A%2F%2Fdqv0cqkoy5oj7.cloudfront.net%2Fuser_2zGhKQBhNr4agrkbTBHMUGRiaSQ%2F3ed66687-e015-41fc-9a9b-7c852b44bb16.png&w=240&q=75" alt="Growth Analytics" className="w-full h-full object-cover rounded-2xl mb-4" />
            </div>
          </div>
        </section>

        {/* NEXT SECTION */}
        <section className="h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-3xl md:text-7xl font-bold text-amber-100/90 mb-4 whitespace-nowrap">The Next Chapter</h2>
            <p className=" md:text-2xl text-amber-100/60">Your journey continues here.</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Page;
