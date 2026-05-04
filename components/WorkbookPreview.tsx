'use client';

import React from 'react';

export const WorkbookPreview = () => {
  return (
    <div className="w-full aspect-[4/5] bg-parchment rounded-xl shadow-2xl border-2 border-forest/10 overflow-hidden flex flex-col p-8 text-left font-sans text-forest">
      {/* Header */}
      <div className="flex justify-between items-baseline mb-10 pb-6 border-b border-forest/10">
        <h3 className="text-4xl font-display italic text-clay">Cooking</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-forest/40">Scout:</span>
          <div className="w-32 border-b border-forest/20 h-4" />
        </div>
      </div>

      {/* Requirement 1 */}
      <div className="mb-8">
        <h4 className="text-lg font-bold mb-4 tracking-tight leading-tight">1. Health and safety. Do the following:</h4>
        
        {/* Item A */}
        <div className="pl-4 mb-6 relative">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-clay/30" />
          <p className="text-[13px] leading-relaxed mb-3">
            <span className="font-bold text-clay">a. Explain to your counselor the most likely hazards</span> you may encounter while participating in cooking activities and what you should do to anticipate, help prevent, mitigate, and respond to these hazards.
          </p>
          <div className="w-full h-32 bg-forest/5 border border-forest/10 rounded-lg relative overflow-hidden mb-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="absolute w-full h-[1px] bg-forest/10" style={{ top: `${(i + 1) * 16}%` }} />
            ))}
          </div>
        </div>

        {/* Item B */}
        <div className="pl-4 relative">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-clay/30" />
          <p className="text-[13px] leading-relaxed mb-3">
            <span className="font-bold text-clay">b. Show that you know first aid for</span> and how to prevent injuries or illnesses that could occur while preparing meals and eating.
          </p>
          
          <div className="space-y-3 mt-4">
            {['Burns and scalds', 'Cuts', 'Choking', 'Allergic reactions'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-forest/5 pb-2">
                <div className="w-1 h-1 bg-clay rotate-45" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-forest/60">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-8 flex justify-center">
        <div className="px-4 py-1 border border-forest/20 rounded-full">
          <span className="text-[9px] font-mono text-forest/30 tracking-[0.3em] uppercase">Field-Ready Output</span>
        </div>
      </div>
    </div>
  );
};
