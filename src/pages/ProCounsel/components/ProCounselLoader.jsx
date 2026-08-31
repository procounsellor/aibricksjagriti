import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRIMARY_INDIGO, BACKGROUND_DARK } from '../colors';

export default function ProCounselLoader() {
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState(0);

  const loadingTexts = [
    'Loading...',
    'Preparing your journey...',
    'Almost there...'
  ];

  useEffect(() => {
    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        const increment = Math.random() * 10 + 5;
        const newProgress = prev + increment;
        
        // Update text based on progress
        if (newProgress > 70) {
          setCurrentText(2);
        } else if (newProgress > 40) {
          setCurrentText(1);
        }
        
        return newProgress;
      });
    }, 150);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        backgroundColor: BACKGROUND_DARK,
        fontFamily: 'Poppins, sans-serif',
        zIndex: 99999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center justify-center w-full max-w-md px-4 sm:px-6 md:px-8">
        {/* Brand Name - Large, elegant text */}
        <motion.div
          className="mb-8 sm:mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-wider text-center"
            style={{ color: '#ffffff' }}
            animate={{
              letterSpacing: ['0.05em', '0.1em', '0.05em']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            ProCounsel
          </motion.h1>
        </motion.div>

        {/* Progress Bar */}
        <div className="w-full mb-6 sm:mb-8">
          <div
            className="h-0.5 sm:h-px bg-gray-700 relative overflow-hidden rounded-full"
            style={{ width: '100%' }}
          >
            <motion.div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{
                backgroundColor: PRIMARY_INDIGO,
                width: `${Math.min(progress, 100)}%`
              }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Loading Text with fade animation */}
        <AnimatePresence mode="wait">
          <motion.p
            key={currentText}
            className="text-xs sm:text-sm md:text-base text-gray-400 text-center tracking-wide uppercase px-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {loadingTexts[currentText]}
          </motion.p>
        </AnimatePresence>

        {/* Percentage Counter */}
        <motion.div
          className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500 tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {Math.round(Math.min(progress, 100))}%
        </motion.div>
      </div>

      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, ${PRIMARY_INDIGO} 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />
    </motion.div>
  );
}

