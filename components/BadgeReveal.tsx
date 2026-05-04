"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/dist/CustomEase";

if (typeof window !== "undefined") {
  gsap.registerPlugin(CustomEase);
}

export default function BadgeReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const introPlayed = typeof window !== "undefined" && sessionStorage.getItem("introPlayed");

  useEffect(() => {
    if (!containerRef.current || !overlayRef.current || introPlayed) return;

    const ctx = gsap.context(() => {
      // Create a cinematic custom ease
      CustomEase.create("badgeEase", "M0,0 C0.126,0.382 0.282,0.674 0.44,0.822 0.632,1.002 0.818,1.001 1,1");

      const tl = gsap.timeline();

      // Initial state
      gsap.set(overlayRef.current, {
        clipPath: "circle(0% at 50% 50%)",
        opacity: 1
      });

      tl.to(overlayRef.current, {
        clipPath: "circle(150% at 50% 50%)",
        duration: 1.5,
        ease: "badgeEase",
        onComplete: () => {
          sessionStorage.setItem("introPlayed", "true");
          gsap.to(containerRef.current, {
            opacity: 0,
            pointerEvents: "none",
            duration: 0.8,
            ease: "power2.inOut"
          });
        }
      });

      // Animated text inside the reveal
      tl.from(".reveal-text", {
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 1,
        ease: "power3.out"
      }, "-=2");

    }, containerRef);

    return () => ctx.revert();
  }, []);

  if (introPlayed) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] flex items-center justify-center bg-forest overflow-hidden">
      <div 
        ref={overlayRef} 
        className="absolute inset-0 bg-oat flex flex-col items-center justify-center"
      >
        <div className="relative flex flex-col items-center">
          <div className="reveal-text text-forest font-mono text-xs uppercase tracking-[0.3em] mb-8">
            Established 1910
          </div>
          <div className="reveal-text flex items-center gap-6 mb-8">
            <div className="h-px w-12 bg-forest/20" />
            <h1 className="text-4xl md:text-6xl font-display text-forest italic tracking-tight">
              Prepared For Life
            </h1>
            <div className="h-px w-12 bg-forest/20" />
          </div>
          <div className="reveal-text text-forest/40 font-mono text-[10px] uppercase tracking-widest">
            Scouting Heritage • Precision Tools
          </div>
        </div>
      </div>
      
      {/* Texture Layer */}
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/felt.png')]" />
    </div>
  );
}
