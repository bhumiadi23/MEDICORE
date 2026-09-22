import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Factory, Warehouse, Truck, Store, CheckCircle, ShieldAlert, User, Activity, ArrowRight, Hexagon, Lock } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import AnimatedLogo from '../components/AnimatedLogo';

const roles = [
  { id: 1, name: 'Manufacturer', icon: Factory, desc: 'Create and manage pharmaceutical batches', color: 'blue', hex: '#3b82f6', bgImage: '/manufacturer-bg.jpg', path: '/manufacturer' },
  { id: 2, name: 'Wholesaler', icon: Warehouse, desc: 'Manage distribution and warehouse inventory', color: 'teal', hex: '#14b8a6', bgImage: '/wholesaler-bg.jpg', path: '/wholesaler' },
  { id: 5, name: 'Transporter', icon: Truck, desc: 'Live logistics control and cold chain', color: 'indigo', hex: '#6366f1', bgImage: '/transporter-bg.jpg', path: '/transporter' },
  { id: 3, name: 'Pharmacy', icon: Store, desc: 'Manage inventory and dispense medicine', color: 'emerald', hex: '#10b981', bgImage: '/pharmacy-bg.jpg', path: '/retailer' },
  { id: 7, name: 'Quality Officer', icon: CheckCircle, desc: 'Review lab reports and quality tests', color: 'purple', hex: '#a855f7', bgImage: '/quality-bg.jpg', path: '/quality-officer' },
  { id: 6, name: 'Regulator', icon: ShieldAlert, desc: 'Monitor safety and network compliance', color: 'amber', hex: '#f59e0b', bgImage: '/regulator-bg.jpg', path: '/regulator' },
  { id: 4, name: 'Customer', icon: User, desc: 'Verify medicine authenticity and origin', color: 'sky', hex: '#0ea5e9', bgImage: '/customer-bg.jpg', path: '/customer' },
  { id: 0, name: 'Admin', icon: Activity, desc: 'MediCore network administration', color: 'slate', hex: '#94a3b8', bgImage: '/admin-bg.jpg', path: '/admin' }
];

const BackgroundParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0"></div>
      
      {/* Animated glowing orbs */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full mix-blend-screen filter blur-[80px]"
          style={{
            backgroundColor: ['#3b82f6', '#14b8a6', '#6366f1', '#a855f7'][i % 4],
            width: Math.random() * 300 + 100,
            height: Math.random() * 300 + 100,
            opacity: Math.random() * 0.15 + 0.05
          }}
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          transition={{
            duration: Math.random() * 20 + 20,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Hexagon grid overlay */}
      <div className="absolute inset-0 opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { account, entityInfo, isOwner } = useWeb3();

  const handleRoleSelect = (role) => {
    navigate(role.path);
  };

  const getColorClasses = (color) => {
    const map = {
      'blue': { border: 'group-hover:border-blue-500', text: 'group-hover:text-blue-400', shadow: 'hover:shadow-blue-500/20', bg: 'bg-blue-500/20' },
      'teal': { border: 'group-hover:border-teal-500', text: 'group-hover:text-teal-400', shadow: 'hover:shadow-teal-500/20', bg: 'bg-teal-500/20' },
      'indigo': { border: 'group-hover:border-indigo-500', text: 'group-hover:text-indigo-400', shadow: 'hover:shadow-indigo-500/20', bg: 'bg-indigo-500/20' },
      'emerald': { border: 'group-hover:border-emerald-500', text: 'group-hover:text-emerald-400', shadow: 'hover:shadow-emerald-500/20', bg: 'bg-emerald-500/20' },
      'purple': { border: 'group-hover:border-purple-500', text: 'group-hover:text-purple-400', shadow: 'hover:shadow-purple-500/20', bg: 'bg-purple-500/20' },
      'amber': { border: 'group-hover:border-amber-500', text: 'group-hover:text-amber-400', shadow: 'hover:shadow-amber-500/20', bg: 'bg-amber-500/20' },
      'sky': { border: 'group-hover:border-sky-500', text: 'group-hover:text-sky-400', shadow: 'hover:shadow-sky-500/20', bg: 'bg-sky-500/20' },
      'slate': { border: 'group-hover:border-slate-400', text: 'group-hover:text-slate-300', shadow: 'hover:shadow-slate-400/20', bg: 'bg-slate-500/20' },
    };
    return map[color];
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      <BackgroundParticles />
      
      <motion.div 
        initial={{ opacity: 0, y: -30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center mb-16 relative z-10 flex flex-col items-center mt-10"
      >
        <div className="mb-8 p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-blue-400/30 shadow-[0_0_50px_rgba(59,130,246,0.25)] relative group">
          <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
          <div className="relative z-10">
            <AnimatedLogo size="large" theme="white" />
          </div>
        </div>
        <motion.h1 
          className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-slate-400 tracking-tight mb-4 leading-tight"
          animate={{ 
            filter: [
              'drop-shadow(0 0 10px rgba(255,255,255,0.1))', 
              'drop-shadow(0 0 30px rgba(59,130,246,0.6))', 
              'drop-shadow(0 0 10px rgba(255,255,255,0.1))'
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          The Enterprise <br className="hidden md:block"/> Blockchain Network
        </motion.h1>
        <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto">
          Select your authorized cryptographic workspace to enter the secure environment.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full relative z-10 pb-20">
        {roles.map((role, idx) => {
          const Icon = role.icon;
          const styles = getColorClasses(role.color);
          
          const isConnected = !!account;
          const isAuthorized = isConnected && (
            (role.id === 0 && isOwner) || 
            (role.id !== 0 && entityInfo?.role === role.id)
          );
          
          // Determine the styling state based on authorization
          const cardOpacityClass = !isConnected ? 'opacity-90' : (!isAuthorized ? 'opacity-50 grayscale' : 'opacity-100');
          const hoverStateClass = isAuthorized 
            ? `hover:border-transparent ${styles.shadow} group-hover:scale-[1.02]` 
            : 'hover:border-red-500/30 hover:shadow-red-500/10 cursor-not-allowed';

          return (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: idx * 0.1, type: 'spring', stiffness: 100, damping: 20 }}
              className={`group relative rounded-3xl p-6 transition-all duration-500 flex flex-col h-[320px] overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-white/10 ${cardOpacityClass} ${hoverStateClass}`}
            >
              {/* Dynamic Animated Background Image */}
              <div 
                className={`absolute inset-0 z-0 bg-cover bg-center transition-all duration-700 opacity-20 ${isAuthorized ? 'group-hover:opacity-50 group-hover:scale-110 grayscale group-hover:grayscale-0' : ''}`}
                style={{ backgroundImage: `url('${role.bgImage}')` }}
              />
              {/* Gradient Overlay to ensure text readability */}
              <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent opacity-100 transition-opacity duration-500" />
              
              {/* Top Accent Line */}
              {isAuthorized && (
                <div 
                  className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-all duration-500 z-20" 
                  style={{ backgroundColor: role.hex, boxShadow: `0 0 20px ${role.hex}` }}
                />
              )}

              <div className="relative z-10 flex flex-col h-full pointer-events-none">
                <div className="flex items-center justify-between mb-auto">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors duration-500 ${isAuthorized ? styles.bg : 'bg-slate-800'}`}>
                    <Icon className={`w-6 h-6 ${isAuthorized ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                  <div className={`font-mono text-xs tracking-widest uppercase ${isAuthorized ? 'text-green-400' : 'text-slate-500'}`}>
                    {isAuthorized ? 'AUTHORIZED' : `SYS_${role.id}`}
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${isAuthorized ? `text-white ${styles.text}` : 'text-slate-400'}`}>
                    {role.name}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {role.desc}
                  </p>
                </div>
              </div>
              
              <div className="relative z-20 mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={() => isAuthorized && handleRoleSelect(role)}
                  disabled={!isAuthorized && isConnected}
                  className={`w-full flex items-center justify-between text-sm font-bold transition-colors duration-300 py-2 group/btn ${
                    !isConnected ? 'text-blue-400 hover:text-blue-300' :
                    isAuthorized ? `text-slate-300 ${styles.text}` : 
                    'text-red-500/70 cursor-not-allowed'
                  }`}
                >
                  <span className="tracking-widest uppercase">
                    {!isConnected ? 'CONNECT TO ENTER' : isAuthorized ? 'INITIALIZE' : 'ACCESS DENIED'}
                  </span>
                  {!isConnected || isAuthorized ? (
                    <ArrowRight className="w-5 h-5 transform group-hover/btn:translate-x-2 transition-transform" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default LandingPage;

