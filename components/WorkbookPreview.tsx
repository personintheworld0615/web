'use client';

import React from 'react';

export const WorkbookPreview = () => {
  return (
    <div className="w-full aspect-[4/5] bg-white rounded-xl shadow-2xl border border-charcoal/10 overflow-hidden flex flex-col p-8 text-left font-sans text-[#1a1a1a]">
      {/* Header */}
      <div className="flex justify-between items-baseline mb-8">
        <h3 className="text-xl font-bold">Cooking</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">Scout's Name:</span>
          <div className="w-48 border-b border-black h-4" />
        </div>
      </div>

      {/* Requirement 1 */}
      <div className="mb-6">
        <h4 className="text-lg font-bold mb-3">1. Health and safety. Do the following:</h4>
        <div className="w-full h-32 bg-[#eef4ff] border border-[#d0e0ff] rounded-sm relative overflow-hidden mb-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute w-full h-[1px] bg-[#d0e0ff]" style={{ top: `${(i + 1) * 20}%` }} />
          ))}
        </div>

        {/* Item A */}
        <div className="pl-4 mb-4">
          <p className="text-[13px] leading-snug mb-1">
            <span className="font-bold">a. Explain to your counselor the most likely hazards</span> you may encounter while participating in cooking activities and what you should do to anticipate, help prevent, mitigate, and respond to these hazards.
          </p>
          <p className="text-[11px] italic text-[#2563eb]">
            Resources: 6 Campfire Cooking Mistakes to Avoid (video), 5 Mistakes EVERY New Camper Makes COOKING (video)
          </p>
        </div>

        <div className="w-full h-32 bg-[#eef4ff] border border-[#d0e0ff] rounded-sm relative overflow-hidden mb-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute w-full h-[1px] bg-[#d0e0ff]" style={{ top: `${(i + 1) * 20}%` }} />
          ))}
        </div>

        {/* Item B */}
        <div className="pl-4">
          <p className="text-[13px] leading-snug mb-1">
            <span className="font-bold">b. Show that you know first aid for</span> and how to prevent injuries or illnesses that could occur while preparing meals and eating, including burns and scalds, cuts, choking, and allergic reactions.
          </p>
        </div>
      </div>

      {/* Bullet List */}
      <div className="space-y-3 mt-2">
        {['Burns and scalds', 'Cuts', 'Choking', 'Allergic reactions'].map((item, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-black/5 pb-2">
            <div className="w-1.5 h-1.5 bg-black rotate-45" />
            <span className="text-[13px]">{item}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 text-center">
        <span className="text-xs font-newsreader italic text-charcoal/40 tracking-widest uppercase">Official Workbook Output</span>
      </div>
    </div>
  );
};
