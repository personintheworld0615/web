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
    <div className="border border-charcoal/10 rounded-2xl overflow-hidden bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🏅</span>
          <div>
            <span className="font-semibold text-charcoal text-sm md:text-base">{badge.name}</span>
            {!badge.required && (
              <span className="ml-2 text-[10px] font-mono uppercase tracking-wider bg-olive/10 text-olive px-2 py-0.5 rounded-full">choice</span>
            )}
          </div>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          className="text-charcoal/40 text-lg"
        >
          ▾
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-charcoal/5 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
                <p className="text-sm text-charcoal/60 leading-relaxed flex-1 italic">{badge.description}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-charcoal/30 mb-2">Generated Workbooks</h3>
                {workbooks.length === 0 ? (
                  <p className="text-xs text-charcoal/40 font-mono italic p-4 bg-charcoal/5 rounded-xl border border-dashed border-charcoal/10 text-center">
                    No workbooks generated yet for this badge.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
  );
}

function WorkbookCard({ wb }: { wb: Workbook }) {
  return (
    <div
      className="bg-white/40 border border-charcoal/5 rounded-xl p-3 flex items-center justify-between gap-3 hover:bg-white/80 transition-colors"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="text-lg shrink-0">{wb.format === "pdf" ? "📄" : "📝"}</span>
        <div className="overflow-hidden">
          <p className="text-xs text-charcoal/40 font-mono truncate">{timeAgo(wb.created_at)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
          wb.format === "pdf" 
            ? "bg-crimson/10 text-crimson" 
            : "bg-olive/10 text-olive"
        }`}>
          {wb.format}
        </span>
        {wb.file_url && (
          <a
            href={wb.file_url}
            download
            className="px-2 py-1 bg-charcoal text-oat rounded-full font-mono text-[9px] uppercase tracking-widest hover:bg-olive transition-colors"
          >
            Get
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

  const requiredBadges = EAGLE_BADGES.filter(b => b.required);
  const choiceBadges = EAGLE_BADGES.filter(b => !b.required);

  const getWorkbooksForBadge = (badgeName: string) => {
    return workbooks.filter(wb => wb.badge_name.toLowerCase() === badgeName.toLowerCase());
  };

  return (
    <main className="min-h-screen bg-oat text-charcoal pt-8 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-6xl font-newsreader italic text-charcoal mb-2"
        >
          Badge Library
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-charcoal/60 text-lg mb-12"
        >
          All Eagle Scout required merit badges — plus a live feed of generated workbooks.
        </motion.p>

        {/* Eagle Required Badges */}
        <section className="mb-14">
          <h2 className="font-mono text-xs uppercase tracking-widest text-charcoal/40 mb-4">
            Required Badges (11)
          </h2>
          <div className="flex flex-col gap-2">
            {requiredBadges.map(badge => (
              <BadgeCard
                key={badge.name}
                badge={badge}
                open={openBadge === badge.name}
                onToggle={() => setOpenBadge(openBadge === badge.name ? null : badge.name)}
                workbooks={getWorkbooksForBadge(badge.name)}
              />
            ))}
          </div>
        </section>

        {/* Choice Badges */}
        <section className="mb-14">
          <h2 className="font-mono text-xs uppercase tracking-widest text-charcoal/40 mb-4">
            Choice Badges (pick one from each group)
          </h2>
          <div className="flex flex-col gap-2">
            {choiceBadges.map(badge => (
              <BadgeCard
                key={badge.name}
                badge={badge}
                open={openBadge === badge.name}
                onToggle={() => setOpenBadge(openBadge === badge.name ? null : badge.name)}
                workbooks={getWorkbooksForBadge(badge.name)}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
