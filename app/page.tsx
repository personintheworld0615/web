"use client";

import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useState, FormEvent, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { WorkbookPreview } from "@/components/WorkbookPreview";
import Magnetic from "@/components/Magnetic";

export default function Home() {
  const [text, setText] = useState("");
  const [format, setFormat] = useState<"pdf" | "docx">("pdf");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ name: string; url: string } | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [skipIntro, setSkipIntro] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("introPlayed")) {
      setSkipIntro(true);
    }
  }, []);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const formY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  // Mouse Overdrive Tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { damping: 20, stiffness: 100 });
  const smoothMouseY = useSpring(mouseY, { damping: 20, stiffness: 100 });

  const rotateX = useTransform(smoothMouseY, [-300, 300], [5, -5]);
  const rotateY = useTransform(smoothMouseX, [-300, 300], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - (left + width / 2));
    mouseY.set(clientY - (top + height / 2));
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const badge = params.get("badge");
    if (badge) setText(`Generate a workbook for the ${badge} merit badge`);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const isLocal = window.location.hostname === "localhost";
      const apiUrl = isLocal ? "http://localhost:3002" : "/api/generate";
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, format }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate workbook");
      }

      const disposition = response.headers.get("Content-Disposition") || "";
      const nameMatch = disposition.match(/filename="(.+?)"/);
      const filename = nameMatch ? nameMatch[1] : `workbook.${format}`;
      const badgeName = filename.replace(/-workbook\.(pdf|docx)$/, "").replace(/-/g, " ");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Auto-download
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setSuccess({ name: badgeName, url });
      setShowSplash(true);
      setTimeout(() => setShowSplash(false), 2000);

      const uniqueFilename = `${Date.now()}-${filename}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("workbooks")
        .upload(uniqueFilename, blob, { contentType: blob.type });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
      }

      let publicUrl = null;
      if (uploadData) {
        const { data: urlData } = supabase.storage
          .from("workbooks")
          .getPublicUrl(uniqueFilename);
        publicUrl = urlData.publicUrl;
      }

      await supabase.from("workbooks").insert({
        badge_name: badgeName || "Unknown Badge",
        format,
        file_url: publicUrl,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-oat text-charcoal selection:bg-forest selection:text-oat overflow-x-hidden font-sans">

      {/* Custom Interactive Cursor (Polish) */}
      <motion.div
        className="fixed top-0 left-0 w-4 h-4 bg-forest rounded-full pointer-events-none z-[9999] mix-blend-difference hidden lg:block"
        style={{ 
          x: useSpring(useMotionValue(0), { damping: 20, stiffness: 200 }), 
          y: useSpring(useMotionValue(0), { damping: 20, stiffness: 200 }) 
        }}
        onUpdate={(latest) => {
          // This is a placeholder for the actual logic that will be handled via global mouse move
        }}
      />

      {/* Floating Scroll Compass (Delight) */}
      <motion.div 
        style={{ rotate: useTransform(scrollYProgress, [0, 1], [0, 360]) }}
        className="fixed bottom-12 right-12 z-50 w-20 h-20 pointer-events-none hidden lg:flex items-center justify-center"
      >
        <div className="absolute inset-0 rounded-full border border-forest/10 bg-oat/50 backdrop-blur-sm" />
        <div className="relative w-full h-full flex items-center justify-center">
           <div className="absolute w-0.5 h-12 bg-clay rounded-full" />
           <div className="absolute top-2 w-2 h-2 bg-clay rotate-45" />
           <div className="absolute bottom-2 w-1 h-1 bg-forest/20 rounded-full" />
           <div className="font-mono text-[8px] uppercase tracking-widest text-forest/40 absolute -top-4">N</div>
        </div>
      </motion.div>
      
      {/* Scroll-Driven Hero Section */}
      {/* Floating Dust Motes (Overdrive) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 0, 
              y: typeof window !== 'undefined' ? Math.random() * window.innerHeight : 0,
              opacity: 0 
            }}
            animate={{ 
              x: ["-10%", "110%"],
              y: ["-10%", "110%"],
              opacity: [0, 0.15, 0]
            }}
            transition={{ 
              duration: 20 + Math.random() * 20, 
              repeat: Infinity, 
              ease: "linear",
              delay: Math.random() * 20
            }}
            className="absolute w-1 h-1 bg-forest/20 rounded-full blur-[1px]"
          />
        ))}
      </div>

      <section 
        ref={heroRef} 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative min-h-screen pt-24 md:pt-32 pb-20 px-6 lg:px-12 perspective-2000"
      >
        
        {/* Custom Ink Filter */}
        <svg className="hidden">
          <filter id="ink-bleed">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="5" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
          </filter>
        </svg>

        <div className="z-10 w-full max-w-5xl mx-auto text-center pt-4">
          <motion.header 
            style={{ 
              opacity: heroOpacity, 
              y: formY,
              rotateX,
              rotateY,
            }}
            className="space-y-10 mb-16 transition-transform duration-200 ease-out preserve-3d"
          >
            <motion.h1 
              className="text-[clamp(3rem,12vw,9rem)] font-display text-forest leading-[0.85] tracking-tighter filter-[url(#ink-bleed)] antialiased"
            >
              { "Merit Badge".split("").map((char, i) => (
                <motion.span
                  key={i}
                  initial={skipIntro ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 40, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: skipIntro ? 0 : i * 0.03, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-block"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
              <br />
              <motion.span 
                initial={skipIntro ? { opacity: 1, scale: 1, rotate: -2 } : { opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: -2 }}
                transition={{ delay: skipIntro ? 0 : 0.4, duration: 0.6, ease: "backOut" }}
                className="italic text-clay inline-block origin-center"
              >
                Boy Scout Workbooks
              </motion.span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-xl md:text-3xl text-earth/60 font-medium leading-relaxed italic max-w-3xl mx-auto"
            >
              Convert raw scouting requirements into professional, fillable PDFs and DOCX files.
            </motion.p>
          </motion.header>

          <motion.form 
            initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              rotateX,
              rotateY,
            }}
            onSubmit={handleSubmit} 
            className="w-full bg-parchment badge-border rounded-[3rem] p-4 md:p-6 relative overflow-hidden preserve-3d transition-transform duration-200 ease-out shadow-[0_30px_60px_-12px_rgba(45,61,46,0.15),0_18px_36px_-18px_rgba(45,61,46,0.2)]"
          >
            {/* Subtle Texture Inside Form */}
            <div className="absolute inset-0 noise opacity-[0.05] pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row bg-oat/30 rounded-[2.5rem] border border-forest/5 overflow-hidden">
              
              {/* Primary Workspace */}
              <div className="flex-1 p-8 md:p-12 space-y-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-forest/10 pb-8">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-clay" />
                       <label className="font-mono text-[10px] uppercase tracking-[0.4em] text-forest font-bold">
                         Requirement Text
                       </label>
                    </div>
                    <p className="text-xs text-earth/40 italic font-medium pl-4">Source: scouting.org / manual text</p>
                  </div>
                  
                    <div className="flex bg-forest/5 p-1 rounded-xl border border-forest/10 backdrop-blur-sm">
                      {(['pdf', 'docx'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFormat(f)}
                          className={`px-6 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest font-bold transition-all ${
                            format === f ? "bg-forest text-oat shadow-lg" : "text-forest/40 hover:text-forest"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                <div className="relative group">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="E.g. 1. Identify the three things to do when you see a forest fire..."
                    className="w-full bg-transparent min-h-[350px] p-0 text-lg md:text-xl text-forest placeholder:text-forest/10 focus:outline-none resize-none font-medium leading-relaxed border-b border-transparent focus:border-clay/20 transition-colors"
                  />
                  
                  <AnimatePresence>
                    {!text && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-4 left-0 right-0 flex flex-col gap-4 pointer-events-none"
                      >
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-px bg-forest/10" />
                           <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-forest/30 font-bold">Try an example</p>
                        </div>
                        <div className="flex flex-wrap gap-3 pointer-events-auto">
                          {[
                            { label: "Camping", text: "1. Show that you know first aid for injuries or illnesses that could occur while camping...\n2. Prepare a list of clothing and gear for a three-day camping trip..." },
                            { label: "First Aid", text: "1. Demonstrate how to treat a minor burn, a cut, and a scrape.\n2. Explain the five most common signals of a heart attack..." },
                            { label: "Cooking", text: "1. Explain the hazards you might encounter while cooking and how to avoid them.\n2. Design a menu for a three-day camping trip..." }
                          ].map((example) => (
                            <motion.button
                              key={example.label}
                              type="button"
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setText(example.text)}
                              className="px-4 py-2 rounded-full border border-forest/10 bg-white/50 text-[10px] font-mono uppercase tracking-widest text-forest/40 hover:bg-forest hover:text-oat hover:border-forest transition-all duration-200"
                            >
                              {example.label}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="p-6 bg-crimson/5 border border-crimson/10 rounded-2xl flex items-start gap-4 my-8"
                      >
                        <div className="w-8 h-8 rounded-full bg-crimson/10 flex items-center justify-center shrink-0">
                           <span className="text-crimson text-sm font-bold">!</span>
                        </div>
                        <div>
                          <p className="text-xs font-mono uppercase tracking-widest text-crimson font-bold mb-1">Generation Error</p>
                          <p className="text-sm text-crimson/80 font-medium">{error}</p>
                        </div>
                      </motion.div>
                    )}
                    {success && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="p-8 bg-forest text-oat rounded-2xl space-y-6 shadow-2xl relative overflow-hidden my-8"
                      >
                        <div className="absolute inset-0 noise opacity-[0.05]" />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="space-y-1">
                            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-oat/40 font-bold">Generation Complete</p>
                            <h3 className="text-3xl font-display italic tracking-tight">{success.name}</h3>
                            <p className="text-xs text-oat/60 font-medium italic">Your merit badge workbook is ready for download.</p>
                          </div>
                          <motion.a 
                            href={success.url} 
                            whileTap={{ scale: 0.97 }}
                            download={`${success.name.toLowerCase().replace(/ /g, '-')}-workbook.${format}`}
                            className="bg-oat text-forest px-8 py-3 rounded-full font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-clay hover:text-oat transition-all duration-200 text-center"
                          >
                            Manual Download
                          </motion.a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Sidebar / Controls */}
              <div className="w-full lg:w-80 bg-forest/[0.03] border-l border-forest/10 p-8 md:p-12 space-y-10">

                <Magnetic>
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.97 }}
                    disabled={loading || !text.trim()}
                    className={`w-full py-6 rounded-full font-mono text-[11px] font-bold uppercase tracking-[0.3em] transition-all duration-200 relative overflow-hidden group/btn ${
                      loading ? "bg-earth/10 text-earth cursor-not-allowed" : "bg-forest text-oat shadow-2xl"
                    }`}
                  >
                    <div className="relative z-10 flex items-center justify-center gap-3">
                      {loading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-earth/30 border-t-earth rounded-full animate-spin" />
                          <span>Preparing...</span>
                        </>
                      ) : (
                        <span>Create Workbook</span>
                      )}

                      {/* Ink Splash Particles (Delight) */}
                      <AnimatePresence>
                        {showSplash && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {[...Array(8)].map((_, i) => (
                              <motion.div
                                key={i}
                                initial={{ scale: 0.95, opacity: 1, x: 0, y: 0 }}
                                animate={{ 
                                  scale: [1, 2], 
                                  opacity: 0,
                                  x: (Math.random() - 0.5) * 200,
                                  y: (Math.random() - 0.5) * 200
                                }}
                                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                                exit={{ opacity: 0 }}
                                className="absolute w-4 h-4 bg-forest rounded-full blur-[2px]"
                                style={{
                                  borderRadius: `${40 + Math.random() * 60}% ${40 + Math.random() * 60}% ${40 + Math.random() * 60}% ${40 + Math.random() * 60}%`
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[0.23,1,0.32,1]" />
                  </motion.button>
                </Magnetic>

              </div>
            </div>
          </motion.form>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-32 md:py-48 bg-white px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-display text-forest mb-6 tracking-tight italic">How it Works</h2>
            <p className="text-xl text-earth/60 max-w-2xl mx-auto font-medium">Three simple steps to go from raw requirements to a field-ready document.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              { step: 1, title: "Paste Requirements", desc: "Copy the official BSA requirements for any merit badge or rank." },
              { step: 2, title: "Structure Content", desc: "We organize the requirements into a clean, easy-to-use worksheet." },
              { step: 3, title: "Download File", desc: "Get your fillable PDF or DOCX file, ready for the next troop meeting." }
            ].map((item, i) => (
              <Magnetic key={i}>
                <motion.div 
                  initial={{ opacity: 0, y: 30, filter: "blur(10px)" }} 
                  whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} 
                  viewport={{ once: true, margin: "-100px" }} 
                  transition={{ delay: i * 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-start p-10 rounded-[2rem] bg-parchment badge-border-sm transition-all duration-300 h-full"
                >
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 + 0.5, duration: 0.8 }}
                    className="text-4xl font-display italic text-clay mb-8 flex items-baseline gap-1"
                  >
                    <span className="text-xl not-italic font-mono opacity-20">0</span>
                    {item.step}
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-4 tracking-tight">{item.title}</h3>
                  <p className="text-earth/70 leading-relaxed font-medium">{item.desc}</p>
                </motion.div>
              </Magnetic>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 md:py-48 bg-forest text-oat px-6 relative overflow-hidden">
        {/* Decorative Badge Element */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-24 items-center">
          <div className="space-y-10">
            <h2 className="text-5xl md:text-7xl font-display italic leading-[0.9] tracking-tight">Built for <br />Scouts & Leaders</h2>
            <p className="text-xl text-oat/70 leading-relaxed font-medium">
              We eliminate the tedious work so you can focus on the Scouting. Every document is generated with precision and respect for the tradition.
            </p>
            <ul className="space-y-8">
              {[
                "Tactile, Field-Ready Formatting",
                "Official PDF & DOCX Compatibility",
                "Complex Nested List Logic",
                "Digital Interactive Input Fields",
                "Custom Troop Requirement Support"
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-5">
                  <div className="w-8 h-8 rounded-full bg-clay/20 flex items-center justify-center shrink-0 mt-1">
                    <svg className="w-4 h-4 text-clay" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-2xl font-medium tracking-tight">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <motion.div 
              initial={{ rotate: 2, scale: 0.95 }}
              whileHover={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full badge-border rounded-[2.5rem] overflow-hidden bg-white shadow-2xl"
            >
              <WorkbookPreview />
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 md:py-48 bg-oat px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-display italic text-forest mb-6 tracking-tight">Questions of the Trail</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                q: "Official BSA Material?",
                a: "No. This tool is built by scouts, for scouts. It is not officially affiliated with the Boy Scouts of America. Requirements should be verified with scouting.org."
              },
              {
                q: "Supported Badges?",
                a: "All of them. Because the AI parses your input, it works with any current, past, or future merit badge or custom award."
              },
              {
                q: "Digital Fillable?",
                a: "Yes. PDF outputs include interactive text fields, calculated for optimal answer length based on the requirement type."
              },
              {
                q: "AI Logic?",
                a: "We use high-end models to reconstruct the hierarchical intent of the text, ensuring lists and sub-lists are perfectly nested."
              }
            ].map((faq, i) => (
              <div key={i} className="p-10 bg-parchment rounded-[2rem] badge-border-sm hover:shadow-xl transition-all duration-500">
                <h3 className="text-2xl font-bold mb-4 tracking-tight">{faq.q}</h3>
                <p className="text-earth/70 leading-relaxed font-medium">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 border-t border-forest/10 flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-10 w-full max-w-4xl px-6">
          <div className="flex items-center gap-6 w-full">
            <div className="h-px flex-1 bg-forest/20" />
            <Link href="/library" className="text-forest hover:text-clay transition-colors font-mono uppercase tracking-[0.3em] text-xs font-bold">
              Merit Badge Workbook List
            </Link>
            <div className="h-px flex-1 bg-forest/20" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full text-center">
            {[
              { name: "Cooking", slug: "cooking" },
              { name: "First Aid", slug: "first-aid" },
              { name: "Citizenship", slug: "citizenship-in-the-community" },
              { name: "Personal Mgmt", slug: "personal-management" }
            ].map(badge => (
              <Link 
                key={badge.slug} 
                href={`/library?badge=${badge.slug}`}
                className="text-[10px] font-mono uppercase tracking-widest text-forest/40 hover:text-clay transition-colors font-bold"
              >
                {badge.name} Workbook
              </Link>
            ))}
          </div>
        </div>
        <div className="text-center space-y-4">
          <p className="font-display text-2xl italic text-forest/40">Prepared For Life.</p>
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-forest/30">
            Engineered with Pride • Not Affiliated with BSA
          </p>
        </div>
      </footer>
    </main>
  );
}
