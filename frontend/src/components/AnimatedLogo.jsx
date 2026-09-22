import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Hexagon } from 'lucide-react';

const AnimatedLogo = ({ theme = 'blue', size = 'default' }) => {
  const getThemeClasses = () => {
    const map = {
      'blue': 'text-blue-600',
      'teal': 'text-teal-600',
      'indigo': 'text-indigo-600',
      'emerald': 'text-emerald-600',
      'purple': 'text-purple-600',
      'amber': 'text-amber-500',
      'sky': 'text-sky-500',
      'slate': 'text-slate-300',
      'white': 'text-white'
    };
    return map[theme] || map['blue'];
  };

  const colorClass = getThemeClasses();
  const textSize = size === 'large' ? 'text-4xl' : 'text-xl';
  const iconSize = size === 'large' ? 'w-10 h-10' : 'w-6 h-6';

  return (
    <motion.div 
      className="flex items-center space-x-2 select-none"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative flex items-center justify-center">
        {/* The moving/rotating background icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className={`absolute ${colorClass} opacity-20`}
        >
          <Hexagon className={iconSize} fill="currentColor" />
        </motion.div>
        
        {/* The pulsing foreground icon */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={theme === 'white' ? { filter: 'drop-shadow(0 0 15px rgba(59,130,246,0.8))' } : {}}
        >
          <Activity className={`${iconSize} ${colorClass} relative z-10`} />
        </motion.div>
      </div>
      
      <span 
        className={`font-black tracking-tight ${textSize} text-current`}
        style={theme === 'white' ? { textShadow: '0 0 20px rgba(255,255,255,0.4), 0 0 40px rgba(255,255,255,0.2)' } : {}}
      >
        MediCore <span className={colorClass} style={theme === 'white' ? { textShadow: '0 0 20px rgba(59,130,246,0.6), 0 0 40px rgba(59,130,246,0.4)' } : {}}>2.0</span>
      </span>
    </motion.div>
  );
};

export default AnimatedLogo;

