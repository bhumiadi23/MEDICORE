import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { 
  Rocket, ShieldCheck, ArrowRight, X, Layers, ChevronDown, Check, 
  Sparkles, ExternalLink, Activity
} from 'lucide-react';
import { ALL_ROLES_LIST } from '../config/roles';
import { shortAddress } from '../utils/helpers';
import toast from 'react-hot-toast';

const COLOR_MAP = {
  teal: {
    badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    glow: 'from-teal-500/30 via-emerald-500/10 to-transparent',
    btn: 'bg-teal-600 hover:bg-teal-500 shadow-teal-500/25',
    accent: 'text-teal-400',
    border: 'border-teal-500/30',
    bar: 'bg-teal-500'
  },
  blue: {
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    glow: 'from-blue-500/30 via-cyan-500/10 to-transparent',
    btn: 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/25',
    accent: 'text-blue-400',
    border: 'border-blue-500/30',
    bar: 'bg-blue-500'
  },
  emerald: {
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    glow: 'from-emerald-500/30 via-teal-500/10 to-transparent',
    btn: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25',
    accent: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bar: 'bg-emerald-500'
  },
  amber: {
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    glow: 'from-amber-500/30 via-yellow-500/10 to-transparent',
    btn: 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/25',
    accent: 'text-amber-400',
    border: 'border-amber-500/30',
    bar: 'bg-amber-500'
  },
  rose: {
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    glow: 'from-rose-500/30 via-pink-500/10 to-transparent',
    btn: 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/25',
    accent: 'text-rose-400',
    border: 'border-rose-500/30',
    bar: 'bg-rose-500'
  },
  purple: {
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    glow: 'from-purple-500/30 via-indigo-500/10 to-transparent',
    btn: 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/25',
    accent: 'text-purple-400',
    border: 'border-purple-500/30',
    bar: 'bg-purple-500'
  },
  violet: {
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    glow: 'from-violet-500/30 via-purple-500/10 to-transparent',
    btn: 'bg-violet-600 hover:bg-violet-500 shadow-violet-500/25',
    accent: 'text-violet-400',
    border: 'border-violet-500/30',
    bar: 'bg-violet-500'
  },
  indigo: {
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    glow: 'from-indigo-500/30 via-blue-500/10 to-transparent',
    btn: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/25',
    accent: 'text-indigo-400',
    border: 'border-indigo-500/30',
    bar: 'bg-indigo-500'
  }
};

const RoleLaunchModal = () => {
  const { roleLaunchModal, closeRoleLaunchModal, switchActiveRole } = useWeb3();
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(3);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const { isOpen, roleConfig, address } = roleLaunchModal || {};
  const theme = COLOR_MAP[roleConfig?.badgeColor || 'teal'] || COLOR_MAP.teal;

  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(3);
      setIsPaused(false);
      setShowRolePicker(false);
    }
  }, [isOpen, roleConfig]);

  useEffect(() => {
    if (!isOpen || isPaused || showRolePicker) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleLaunch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPaused, showRolePicker, roleConfig]);

  const handleLaunch = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    closeRoleLaunchModal();
    if (roleConfig?.role) {
      await switchActiveRole(roleConfig.role);
    }
    if (roleConfig?.path) {
      toast.success(`Launching ${roleConfig.name} workspace!`, { icon: '🚀', duration: 3000 });
      navigate(roleConfig.path);
    }
  };

  const handleSelectDifferentRole = async (r) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowRolePicker(false);
    closeRoleLaunchModal();
    await switchActiveRole(r.role);
    toast.success(`Switched to ${r.name} workspace!`, { icon: '🔄', duration: 2500 });
    navigate(r.path);
  };

  if (!isOpen || !roleConfig) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 16 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative max-w-lg w-full bg-slate-900 border border-white/15 rounded-3xl shadow-2xl overflow-hidden text-white"
        >
          {/* Top Radial Glow */}
          <div className={`absolute top-0 inset-x-0 h-40 bg-gradient-to-b ${theme.glow} pointer-events-none`} />

          {/* Close Button */}
          <button
            onClick={closeRoleLaunchModal}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all z-20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="p-7 pb-4 relative z-10 text-center">
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className={`w-16 h-16 rounded-2xl bg-white/5 border ${theme.border} flex items-center justify-center shadow-lg relative`}>
                <Rocket className={`w-8 h-8 ${theme.accent} animate-bounce`} />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
              </span>
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-2 border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Wallet Detected & Verified</span>
            </div>

            <h3 className="text-2xl font-black tracking-tight text-white mt-1">
              Connected as {roleConfig.name}!
            </h3>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              Launching Workspace in <span className={`font-mono font-bold ${theme.accent}`}>{secondsLeft}s</span>...
            </p>
          </div>

          {/* Card Body */}
          <div className="px-7 py-3 relative z-10 space-y-4">
            {/* Role Info Box */}
            <div className={`p-4 rounded-2xl bg-slate-950/70 border ${theme.border} space-y-2.5`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enterprise Role</span>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${theme.badge}`}>
                  {roleConfig.title || roleConfig.name}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Address</span>
                <span className="text-slate-200 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                  {shortAddress(address || '0x0000000000000000000000000000000000000000')}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Target Workspace</span>
                <span className={`font-bold ${theme.accent}`}>
                  {roleConfig.path}
                </span>
              </div>

              {roleConfig.description && (
                <p className="text-xs text-slate-400 pt-1 border-t border-white/5 italic">
                  "{roleConfig.description}"
                </p>
              )}
            </div>

            {/* Countdown Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className={`h-full ${theme.bar}`}
                  initial={{ width: '100%' }}
                  animate={{ width: `${(secondsLeft / 3) * 100}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>{isPaused ? 'Auto-redirect paused (hovering)' : 'Auto-redirect active'}</span>
                <span>{secondsLeft}s</span>
              </div>
            </div>

            {/* Alternate Role Picker Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowRolePicker(!showRolePicker);
                  setIsPaused(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Not your workspace? Switch to another role</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRolePicker ? 'rotate-180' : ''}`} />
              </button>

              {showRolePicker && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 p-2 bg-slate-950 rounded-2xl border border-white/15 shadow-2xl max-h-48 overflow-y-auto space-y-1"
                >
                  {ALL_ROLES_LIST.map((r) => {
                    const isSelected = r.role === roleConfig.role;
                    return (
                      <button
                        key={r.role}
                        onClick={() => handleSelectDifferentRole(r)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all ${
                          isSelected
                            ? 'bg-blue-600/30 text-blue-300 font-bold border border-blue-500/30'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-400' : 'bg-slate-500'}`}></span>
                          <span>{r.name}</span>
                        </div>
                        {isSelected ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <ArrowRight className="w-3.5 h-3.5 opacity-40" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-7 pt-4 relative z-10 flex items-center space-x-3">
            <button
              onClick={closeRoleLaunchModal}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
            >
              Stay on Page
            </button>
            <button
              onClick={handleLaunch}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] ${theme.btn}`}
            >
              <span>Launch Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RoleLaunchModal;
