'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const MESSAGES = [
  "Welcome to the Workbook Generator.",
  "The professional tool for BSA troop leaders.",
  "Convert raw requirements into clean, fillable PDFs.",
  "Paste your text and prepare your scout's next badge."
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('has_seen_onboarding');
    if (!hasSeen) {
      setIsVisible(true);
      const timer = setInterval(() => {
        setStep((prev) => {
          if (prev >= MESSAGES.length - 1) {
            clearInterval(timer);
            setTimeout(() => {
              setIsVisible(false);
              localStorage.setItem('has_seen_onboarding', 'true');
            }, 2000);
            return prev;
          }
          return prev + 1;
        });
      }, 3000);
      return () => clearInterval(timer);
    }
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-forest flex items-center justify-center p-6"
        >
          <div className="absolute inset-0 noise opacity-[0.05]" />
          
          <div className="max-w-2xl w-full text-center space-y-12">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div className="flex justify-center mb-12">
                <div className="w-16 h-16 rounded-full border-2 border-oat/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-clay animate-pulse" />
                </div>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-display italic text-oat tracking-tight leading-[0.9]">
                {MESSAGES[step]}
              </h2>
              
              <div className="flex justify-center gap-2">
                {MESSAGES.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 transition-all duration-1000 ${i === step ? "w-8 bg-clay" : "w-2 bg-oat/20"}`} 
                  />
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="pt-12"
            >
               <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-oat/30">Ready</span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
