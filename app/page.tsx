"use client";

import { motion } from "framer-motion";
import { useState, FormEvent, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [text, setText] = useState("");
  const [format, setFormat] = useState<"pdf" | "docx">("pdf");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill badge name from ?badge= query param (from Library page)
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

      // Read badge name from response header (set by Python backend)
      const disposition = response.headers.get("Content-Disposition") || "";
      const nameMatch = disposition.match(/filename="(.+?)"/);
      const filename = nameMatch ? nameMatch[1] : `workbook.${format}`;
      const badgeName = filename.replace(/-workbook\.(pdf|docx)$/, "").replace(/-/g, " ");

      // Handle file download locally
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      // Upload to Supabase Storage
      const uniqueFilename = `${Date.now()}-${filename}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("workbooks")
        .upload(uniqueFilename, blob, {
          contentType: blob.type,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        // Continue anyway so the user gets their file locally, even if public storage fails
      }

      let publicUrl = null;
      if (uploadData) {
        const { data: urlData } = supabase.storage
          .from("workbooks")
          .getPublicUrl(uniqueFilename);
        publicUrl = urlData.publicUrl;
      }

      // Log to Supabase library
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
    <main className="min-h-screen flex flex-col pt-8 pb-12 p-8 bg-oat relative overflow-hidden text-charcoal selection:bg-olive selection:text-oat">
      
      {/* Decorative Badges (Floating in background) */}
      <motion.div 
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }} 
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-[10%] opacity-80 pointer-events-none drop-shadow-xl"
      >
        <Image src="/badge_icon.png" alt="Badge" width={120} height={120} className="rounded-full" />
      </motion.div>
      <motion.div 
        animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-32 right-[10%] opacity-80 pointer-events-none drop-shadow-xl"
      >
        <Image src="/ussp_logo.png" alt="USSP Logo" width={140} height={140} className="rounded-full" />
      </motion.div>

      {/* Decorative Sash line */}
      <div className="absolute inset-0 pointer-events-none flex justify-center items-center opacity-10">
        <div className="w-[150%] h-32 bg-olive -rotate-45 transform origin-center border-y-8 border-charcoal/20" />
      </div>

      <div className="z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
        
        <header className="mb-12 text-center">
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-newsreader italic text-charcoal leading-tight mb-4"
          >
            Workbook Generator
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-charcoal/70 font-sans max-w-2xl mx-auto"
          >
            Paste your merit badge or rank requirements below. Our AI will automatically structure them into a beautiful, fillable PDF or editable Word doc.
          </motion.p>
        </header>

        <motion.form 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit} 
          className="w-full bg-white/50 backdrop-blur-md border border-charcoal/10 rounded-3xl p-6 md:p-8 shadow-2xl relative"
        >
          {/* Format Toggle */}
          <div className="flex justify-center mb-6">
            <div className="bg-charcoal/5 p-1 rounded-full flex gap-1 border border-charcoal/10">
              <button
                type="button"
                onClick={() => setFormat("pdf")}
                className={`px-6 py-2 rounded-full font-mono text-xs font-bold uppercase transition-all ${format === "pdf" ? "bg-charcoal text-oat shadow-lg" : "text-charcoal/40 hover:text-charcoal"}`}
              >
                PDF (Official)
              </button>
              <button
                type="button"
                onClick={() => setFormat("docx")}
                className={`px-6 py-2 rounded-full font-mono text-xs font-bold uppercase transition-all ${format === "docx" ? "bg-charcoal text-oat shadow-lg" : "text-charcoal/40 hover:text-charcoal"}`}
              >
                Word (Editable)
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="1. Do the following:\n  a. Explain the most likely hazards...\n  b. Show first aid for..."
              className="w-full h-80 bg-white border border-charcoal/20 rounded-2xl p-6 text-charcoal font-mono text-sm md:text-base resize-none focus:outline-none focus:ring-2 focus:ring-olive/50 focus:border-olive transition-all placeholder:text-charcoal/30 shadow-inner"
              disabled={loading}
            />
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-olive/30 border-t-crimson rounded-full animate-spin" />
                <p className="font-mono text-sm text-charcoal font-semibold animate-pulse">
                  Analyzing requirements & generating {format.toUpperCase()}...
                </p>
                <p className="font-mono text-xs text-charcoal/50">This may take ~20 seconds</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col items-center gap-4">
            {error && (
              <p className="text-crimson font-mono text-sm bg-crimson/10 px-4 py-2 rounded-lg border border-crimson/20">
                {error}
              </p>
            )}
            
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="group relative px-10 py-4 bg-olive text-oat rounded-full font-sans text-lg md:text-xl font-bold italic tracking-wide overflow-hidden shadow-lg shadow-olive/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? "Generating..." : `Download ${format.toUpperCase()}`}
                {!loading && (
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                )}
              </span>
              <div className="absolute inset-0 bg-crimson translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
            </button>
          </div>
        </motion.form>

      </div>

      <footer className="absolute bottom-6 font-mono text-[10px] uppercase tracking-widest text-charcoal/40 flex items-center gap-4">
        <span>Engineered with ❤️ for Scouts</span>
        <span>•</span>
        <Link href="/library" className="hover:text-olive transition-colors">Badge Library →</Link>
      </footer>
    </main>
  );
}
