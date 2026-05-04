"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase, Workbook } from "@/lib/supabase";

// All Eagle-required merit badges
const EAGLE_BADGES = [
  {
    name: "First Aid",
    required: true,
    description: "Learn life-saving skills including CPR, treating wounds, burns, fractures, and emergency response."
  },
  {
    name: "Citizenship in the Community",
    required: true,
    description: "Understand your role in your community, including local government, service, and civic responsibilities."
  },
  {
    name: "Citizenship in the Nation",
    required: true,
    description: "Explore the U.S. government, the Constitution, national monuments, and your duties as a citizen."
  },
  {
    name: "Citizenship in the World",
    required: true,
    description: "Study international organizations, world geography, and global issues affecting our planet."
  },
  {
    name: "Citizenship in Society",
    required: true,
    description: "Learn about diversity, inclusion, and developing a personal code of ethics for engaging with others."
  },
  {
    name: "Communication",
    required: true,
    description: "Develop public speaking, writing, and interpersonal communication skills."
  },
  {
    name: "Cooking",
    required: true,
    description: "Learn nutrition, food safety, meal planning, and prepare meals in both camp and home settings."
  },
  {
    name: "Personal Fitness",
    required: true,
    description: "Create and follow a physical fitness program, understand nutrition, and set personal health goals."
  },
  {
    name: "Emergency Preparedness",
    required: false,
    description: "Plan and execute emergency response, survival, and evacuation procedures. (Alt: Lifesaving)"
  },
  {
    name: "Lifesaving",
    required: false,
    description: "Learn water rescue techniques, first aid for drowning, and water safety. (Alt: Emergency Preparedness)"
  },
  {
    name: "Environmental Science",
    required: false,
    description: "Study ecosystems, pollution, wildlife, and conduct environmental experiments. (Alt: Sustainability)"
  },
  {
    name: "Sustainability",
    required: false,
    description: "Explore sustainable practices in energy, food, water, and community. (Alt: Environmental Science)"
  },
  {
    name: "Personal Management",
    required: true,
    description: "Learn budgeting, banking, investing, and managing your personal finances and time."
  },
  {
    name: "Swimming",
    required: false,
    description: "Demonstrate swimming proficiency and water safety skills. (Alt: Hiking or Cycling)"
  },
  {
    name: "Hiking",
    required: false,
    description: "Complete a series of long-distance hikes and learn trail navigation. (Alt: Swimming or Cycling)"
  },
  {
    name: "Cycling",
    required: false,
    description: "Learn bicycle maintenance, safety, and complete progressively longer rides. (Alt: Swimming or Hiking)"
  },
  {
    name: "Camping",
    required: true,
    description: "Demonstrate outdoor living skills through camping experiences across different environments."
  },
  {
    name: "Family Life",
    required: true,
    description: "Understand family responsibilities, participate in family meetings, and complete a 91-day project."
  },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function BadgeCard({ badge, open, onToggle, workbooks }: {
  badge: typeof EAGLE_BADGES[0];
  open: boolean;
  onToggle: () => void;
  workbooks: Workbook[];
}) {
  return (
    <motion.div 
      layout
      className={`relative group ${open ? "col-span-full" : "col-span-1"}`}
    >
      <div className={`badge-border-sm rounded-[2rem] overflow-hidden transition-all duration-500 ${open ? "bg-parchment shadow-2xl" : "bg-white/40 hover:bg-white hover:-translate-y-1"}`}>

        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-8 py-6 text-left"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-forest/5 flex items-center justify-center border border-forest/10">
               <span className="text-xl">🏅</span>
            </div>
            <div>
              <span className="font-display text-2xl text-forest tracking-tight">{badge.name}</span>
              {!badge.required && (
                <span className="ml-3 text-[9px] font-mono uppercase tracking-widest bg-clay/10 text-clay px-2 py-0.5 rounded-full font-bold">Choice</span>
              )}
            </div>
          </div>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            className="w-8 h-8 rounded-full flex items-center justify-center border border-forest/10 text-forest/40"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </motion.div>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="px-8 pb-8 border-t border-forest/5 pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-8">
                  <p className="text-base text-earth/60 leading-relaxed flex-1 italic font-medium">{badge.description}</p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-mono text-[9px] uppercase tracking-[0.3em] text-forest/30 font-bold">Tactile Archive Feed</h3>
                  {workbooks.length === 0 ? (
                    <div className="p-8 bg-forest/5 rounded-2xl border border-dashed border-forest/20 text-center">
                      <p className="text-xs text-forest/40 font-mono italic">No generated heritage found for this badge yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {workbooks.map(wb => (
                        <WorkbookCard key={wb.id} wb={wb} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function WorkbookCard({ wb }: { wb: Workbook }) {
  return (
    <div
      className="bg-white/60 border border-forest/5 rounded-2xl p-4 flex items-center justify-between gap-4 hover:shadow-lg hover:border-forest/20 transition-all duration-300 group"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${wb.format === "pdf" ? "bg-crimson/10" : "bg-clay/10"}`}>
          <span className="text-lg">{wb.format === "pdf" ? "📄" : "📝"}</span>
        </div>
        <div className="overflow-hidden">
          <p className="text-[10px] text-forest/30 font-mono uppercase tracking-widest font-bold mb-1">{timeAgo(wb.created_at)}</p>
          <div className="flex items-center gap-2">
             <span className="font-display text-sm text-forest italic">Workbook {wb.format.toUpperCase()}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {wb.file_url && (
          <a
            href={wb.file_url}
            download
            className="w-10 h-10 bg-forest text-oat rounded-full flex items-center justify-center hover:bg-clay transition-colors shadow-lg shadow-forest/20 group-hover:scale-110 transition-transform"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          </a>
        )}
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const [openBadge, setOpenBadge] = useState<string | null>(null);
  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    supabase
      .from("workbooks")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setWorkbooks(data as Workbook[]);
        setLoading(false);
      });
  }, []);

  const filteredBadges = EAGLE_BADGES.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const requiredBadges = filteredBadges.filter(b => b.required);
  const choiceBadges = filteredBadges.filter(b => !b.required);

  const getWorkbooksForBadge = (badgeName: string) => {
    return workbooks.filter(wb => wb.badge_name.toLowerCase() === badgeName.toLowerCase());
  };

  const recentWorkbooks = workbooks.slice(0, 4);

  return (
    <main className="min-h-screen bg-oat text-forest pt-24 p-6 md:p-12 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full noise pointer-events-none opacity-[0.03]" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-forest/5 rounded-full blur-[100px]" />
      
      <div className="max-w-7xl mx-auto relative">
        <header className="mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-forest/40 font-bold">Library</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-display italic text-forest mb-6 tracking-tight leading-[0.8]"
          >
            Merit Badge <br />Workbook List
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-earth/60 text-xl max-w-xl font-medium leading-relaxed"
          >
            A curated inventory of Boy Scout workbooks and Eagle Scout heritage. Browse our comprehensive merit badge workbook list and explore the community's generated field-work.
          </motion.p>
        </header>

        {/* Search "Sticky Label" */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-20 sticky top-8 z-50 flex justify-center"
        >
          <div className="relative w-full max-w-2xl bg-parchment badge-border-sm p-1 rounded-2xl shadow-2xl">
            <input
              type="text"
              placeholder="Search the Archive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-2 border-forest/5 rounded-xl px-8 py-5 outline-none focus:border-clay/30 transition-all text-forest placeholder:text-forest/20 font-display italic text-xl"
            />
            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-forest/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>
        </motion.div>

        {/* Recently Generated - Staggered Grid */}
        {!searchQuery && recentWorkbooks.length > 0 && (
          <section className="mb-24">
            <div className="flex items-center gap-6 mb-10">
               <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-clay font-bold">Recent Field Deployments</h2>
               <div className="h-px flex-1 bg-clay/10" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentWorkbooks.map((wb, i) => (
                <motion.div
                  key={wb.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <WorkbookCard wb={wb} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Bento Grid for Badges */}
        <div className="space-y-24">
          {requiredBadges.length > 0 && (
            <section>
              <div className="flex items-center gap-6 mb-10">
                 <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-forest font-bold">Eagle Required ({requiredBadges.length})</h2>
                 <div className="h-px flex-1 bg-forest/10" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                {requiredBadges.map((badge, i) => (
                  <motion.div
                    key={badge.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <BadgeCard
                      badge={badge}
                      open={openBadge === badge.name}
                      onToggle={() => setOpenBadge(openBadge === badge.name ? null : badge.name)}
                      workbooks={getWorkbooksForBadge(badge.name)}
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {choiceBadges.length > 0 && (
            <section>
              <div className="flex items-center gap-6 mb-10">
                 <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-forest font-bold">Elective Choice ({choiceBadges.length})</h2>
                 <div className="h-px flex-1 bg-forest/10" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {choiceBadges.map((badge, i) => (
                  <motion.div
                    key={badge.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <BadgeCard
                      badge={badge}
                      open={openBadge === badge.name}
                      onToggle={() => setOpenBadge(openBadge === badge.name ? null : badge.name)}
                      workbooks={getWorkbooksForBadge(badge.name)}
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* No Results */}
        {requiredBadges.length === 0 && choiceBadges.length === 0 && (
          <div className="text-center py-32">
            <p className="text-forest/30 font-display text-3xl italic">No workbooks found</p>
            <button 
              onClick={() => setSearchQuery("")}
              className="mt-6 font-mono text-[10px] uppercase tracking-widest text-clay hover:underline"
            >
              Clear Search Parameters
            </button>
          </div>
        )}
        {/* SEO Content Section */}
        <section className="mt-48 pt-24 border-t border-forest/10">
          <div className="max-w-4xl mx-auto space-y-12">
            <h2 className="text-4xl font-display italic text-forest tracking-tight">About our Boy Scout Workbooks</h2>
            <div className="grid md:grid-cols-2 gap-12 text-earth/70 font-medium leading-relaxed">
              <div className="space-y-6">
                <p>
                  Finding a reliable **merit badge workbook** is a critical step for any Scout on the path to Eagle. Our library provides a complete **merit badge workbook list** that is updated in real-time by the scouting community. Whether you are looking for "Eagle Required" badges or specialized electives, our generator ensures you have the most accurate requirements.
                </p>
                <p>
                  Every **boy scout workbook** generated here is designed to be tactile and field-ready. We reconstruct complex nested lists and requirements into fillable PDFs and DOCX files that respect the tradition of scouting while embracing modern digital convenience.
                </p>
              </div>
              <div className="space-y-6">
                <p>
                  Why use our **merit badge workbook list**? Official requirements from scouting.org can often be difficult to format for actual use in the field. Our tool takes those raw requirements and structures them into professional worksheets, complete with interactive text fields and perfectly nested sub-lists.
                </p>
                <p>
                  From **Cooking Merit Badge workbooks** to **First Aid** and **Personal Management**, our archive covers the entire spectrum of BSA awards. Explore the library, search for your specific badge, and download your workbook to get started on your next advancement today.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
