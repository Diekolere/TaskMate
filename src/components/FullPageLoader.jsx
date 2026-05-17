import React from 'react';
import { motion } from 'framer-motion';

export default function FullPageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        {/* Logo with subtle pulse */}
        <motion.img 
          src="/icon.png" 
          alt="TaskMate" 
          className="h-16 w-16 mb-4"
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Text */}
        <span className="font-bold text-2xl tracking-tight text-[#1a2b3c] font-serif mb-8">
          TaskMate
        </span>
        
        {/* Mini Status Bar (Indeterminate) */}
        <div className="w-32 h-1 bg-[#1a2b3c]/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-[#7AC142] rounded-full w-1/3"
            animate={{ 
              x: ["-100%", "300%"] 
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </div>
      </div>
    </div>
  );
}
