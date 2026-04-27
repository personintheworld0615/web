"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useState, FormEvent, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [text, setText] = useState("");
  const [format, setFormat] = useState<"pdf" | "docx">("pdf");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const formY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

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
    
    try {
      const response = await fetch("/api/generate", {
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
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

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
    <main className="bg-oat text-charcoal selection:bg-olive selection:text-oat overflow-x-hidden font-sans">
      
      {/* Scroll-Driven Hero Section */}
      <section ref={heroRef} className="relative min-h-[95vh] flex flex-col items-center pt-16 md:pt-12 pb-20 px-6">
        
        {/* Background Decorative Animations */}
        <motion.div 
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="absolute inset-0 pointer-events-none flex justify-center items-center opacity-10"
        >
          <div className="w-[150%] h-40 bg-olive -rotate-12 transform origin-center border-y-[12px] border-charcoal/20 blur-3xl" />
        </motion.div>
        
        <div className="z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
          <motion.header 
            style={{ opacity: heroOpacity, y: formY }}
            className="mb-10 text-center max-w-3xl"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-5xl md:text-7xl lg:text-8xl font-newsreader italic text-charcoal leading-tight mb-6"
            >
              BSA Merit Badge <br />
              <span className="text-olive">Workbook Generator</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-lg md:text-2xl text-charcoal/80 font-sans mx-auto font-medium"
            >
              Paste your BSA scout requirements. Our AI instantly structures them into a beautiful, fillable PDF or editable Word document.
            </motion.p>
          </motion.header>

          <motion.form 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.4 }}
            onSubmit={handleSubmit} 
            className="w-full bg-white/70 backdrop-blur-xl border border-charcoal/10 rounded-3xl p-6 md:p-10 shadow-2xl relative"
          >
            <div className="flex justify-center mb-8">
              <div className="bg-charcoal/5 p-1.5 rounded-full flex gap-2 border border-charcoal/10 shadow-inner">
                <button
                  type="button"
                  onClick={() => setFormat("pdf")}
                  className={`px-8 py-3 rounded-full font-mono text-sm font-bold uppercase tracking-wider transition-all duration-300 ${format === "pdf" ? "bg-charcoal text-oat shadow-lg scale-105" : "text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5"}`}
                >
                  PDF (Official)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("docx")}
                  className={`px-8 py-3 rounded-full font-mono text-sm font-bold uppercase tracking-wider transition-all duration-300 ${format === "docx" ? "bg-charcoal text-oat shadow-lg scale-105" : "text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5"}`}
                >
                  Word (Editable)
                </button>
              </div>
            </div>

            <div className="relative group">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="1. Do the following:\n  a. Explain the most likely hazards...\n  b. Show first aid for..."
                className="w-full h-80 bg-white border-2 border-charcoal/10 rounded-2xl p-6 text-charcoal font-mono text-base md:text-lg resize-none focus:outline-none focus:border-olive transition-colors placeholder:text-charcoal/20 shadow-inner group-hover:border-charcoal/20"
                disabled={loading}
              />
              {loading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-5">
                  <div className="w-16 h-16 border-4 border-olive/30 border-t-olive rounded-full animate-spin" />
                  <p className="font-mono text-base text-charcoal font-bold animate-pulse">
                    Structuring {format.toUpperCase()} Document...
                  </p>
                  <p className="font-mono text-xs text-charcoal/50 uppercase tracking-widest">Powered by AI • ~20 seconds</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              {error && (
                <p className="text-crimson font-mono text-sm bg-crimson/10 px-4 py-3 rounded-xl border border-crimson/20 w-full text-center">
                  {error}
                </p>
              )}
              
              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="group relative w-full md:w-auto px-12 py-5 bg-olive text-oat rounded-2xl font-sans text-xl font-bold italic tracking-wide overflow-hidden shadow-xl shadow-olive/20 hover:shadow-olive/40 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? "Generating..." : `Download ${format.toUpperCase()}`}
                  {!loading && (
                    <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  )}
                </span>
                <div className="absolute inset-0 bg-charcoal/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
              </button>
            </div>
          </motion.form>
        </motion.div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 md:py-32 bg-white px-6 relative border-t border-charcoal/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-4xl md:text-5xl font-newsreader italic text-olive mb-4">How it Works</h2>
            <p className="text-lg text-charcoal/60 max-w-2xl mx-auto font-sans">Three simple steps to go from raw merit badge requirements to a professional, fillable document ready for your next troop meeting.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            {[
              { step: "01", title: "Copy Requirements", desc: "Find the official BSA requirements for your desired merit badge or rank and paste them into our generator." },
              { step: "02", title: "AI Analysis", desc: "Our AI engine parses the hierarchical structure (1, a, i) and intelligently formats it with appropriate spacing and input areas." },
              { step: "03", title: "Download & Fill", desc: "Instantly download a beautifully formatted PDF or an editable Word Document. Fully compatible with digital PDF fillers." }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }}
                className="flex flex-col items-center text-center p-8 rounded-3xl bg-oat/50 border border-charcoal/5 hover:border-olive/20 transition-colors"
              >
                <div className="text-5xl font-newsreader italic text-olive/30 mb-6">{item.step}</div>
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-charcoal/70 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 bg-olive text-oat px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-6xl font-newsreader italic mb-6">Built for Scouts & Leaders</h2>
            <p className="text-lg text-oat/80 mb-8 leading-relaxed">
              We built this tool to eliminate the tedious formatting work required to make usable workbooks. Let the AI handle the formatting so you can focus on the Scouting.
            </p>
            <ul className="space-y-6">
              {[
                "100% Free to use, forever.",
                "Supports both PDF and Microsoft Word (DOCX).",
                "Automatically detects complex nested lists.",
                "Generates interactive PDF text fields.",
                "Works with any custom Troop or Patrol requirements."
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-4">
                  <svg className="w-6 h-6 text-oat/50 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xl font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] bg-oat/10 rounded-3xl border border-oat/20 p-8 shadow-2xl backdrop-blur-sm flex flex-col justify-between transform rotate-2 hover:rotate-0 transition-transform duration-500">
               <div className="w-full h-8 bg-oat/20 rounded-full mb-6" />
               <div className="space-y-4 mb-auto">
                 <div className="w-3/4 h-4 bg-oat/10 rounded-full" />
                 <div className="w-full h-24 bg-oat/10 rounded-xl border border-oat/20" />
                 <div className="w-5/6 h-4 bg-oat/10 rounded-full" />
                 <div className="w-full h-32 bg-oat/10 rounded-xl border border-oat/20" />
               </div>
               <div className="mt-8 text-center font-newsreader italic text-2xl text-oat/50">Example Workbook Output</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 md:py-32 bg-oat px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-newsreader italic text-charcoal mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "Is this official BSA material?",
                a: "No. This tool is built by scouts, for scouts, but is not officially affiliated with the Boy Scouts of America. You must still pull the official requirements from scouting.org."
              },
              {
                q: "Which merit badges are supported?",
                a: "All of them! Because you paste the text directly into our tool, it works with any current or future merit badge, rank requirement, or even custom troop awards."
              },
              {
                q: "How does the AI formatting work?",
                a: "We use a fine-tuned Large Language Model (LLM) to analyze the text you paste. It identifies hierarchical structures (like 1.a.i.) and programmatically constructs a document tree. This tree is then rendered into a fillable PDF or DOCX file."
              },
              {
                q: "Are the PDFs digitally fillable?",
                a: "Yes! If you select the PDF option, the generator automatically calculates the necessary space for answers and injects interactive PDF text fields that can be filled out on any device."
              }
            ].map((faq, i) => (
              <div key={i} className="p-8 bg-white rounded-3xl border border-charcoal/5 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold mb-3">{faq.q}</h3>
                <p className="text-charcoal/70 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-charcoal/10 flex flex-col items-center gap-6">
        <div className="flex items-center gap-4 text-charcoal/60 hover:text-olive transition-colors font-mono uppercase tracking-widest text-sm">
          <Link href="/library">Explore the Badge Library →</Link>
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-charcoal/40">
          Engineered with ❤️ for Scouts
        </p>
      </footer>
    </main>
  );
}
