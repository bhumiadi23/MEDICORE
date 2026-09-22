import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, LogOut, ShieldAlert, Search, Activity, User, 
  Factory, Truck, Store, CheckCircle, Database, FileText, AlertTriangle, AlertCircle,
  Package, Map, Clock, ClipboardCheck, Users, Settings, Thermometer, FlaskConical
} from 'lucide-react';
import { formatAddress, getRoleLabel, ROLE_ROUTES } from '../utils/helpers';
import NotificationCenter from '../components/NotificationCenter';
import AnimatedLogo from '../components/AnimatedLogo';

const ROLE_CONFIGS = {
  '/manufacturer': {
    roleId: 1,
    theme: 'blue',
    title: 'Manufacturing Command Center',
    bgImage: '/manufacturer-bg.jpg',
    menu: [
      { name: 'Command Center', path: '/manufacturer', icon: LayoutDashboard }
    ]
  },
  '/wholesaler': {
    roleId: 2,
    theme: 'teal',
    title: 'Distribution Center',
    bgImage: '/wholesaler-bg.jpg',
    menu: [
      { name: 'Command Center', path: '/wholesaler', icon: LayoutDashboard },
      { name: 'Supply Distribution', path: '/wholesaler/supply', icon: Truck },
      { name: 'Inventory Ledger', path: '/wholesaler/inventory', icon: Package }
    ]
  },
  '/transporter': {
    roleId: 5,
    theme: 'indigo',
    title: 'Logistics Control Center',
    bgImage: '/transporter-bg.jpg',
    menu: [
      { name: 'Live Shipments', path: '/transporter', icon: Map },
      { name: 'Routes', path: '/transporter/routes', icon: Truck },
      { name: 'Cold Chain', path: '/transporter/cold-chain', icon: Thermometer },
      { name: 'Incidents', path: '/transporter/incidents', icon: AlertTriangle },
      { name: 'Delivery History', path: '/transporter/history', icon: Clock }
    ]
  },
  '/retailer': {
    roleId: 3,
    theme: 'emerald',
    title: 'Pharmacy Operations',
    bgImage: '/pharmacy-bg.jpg',
    menu: [
      { name: 'Command Center', path: '/retailer', icon: LayoutDashboard },
      { name: 'Point of Sale', path: '/retailer/dispense', icon: Store },
      { name: 'Pharmacy Ledger', path: '/retailer/inventory', icon: Package }
    ]
  },
  '/quality-officer': {
    roleId: 7,
    theme: 'purple',
    title: 'Quality Control Center',
    bgImage: '/quality-bg.jpg',
    menu: [
      { name: 'Command Center', path: '/quality-officer', icon: LayoutDashboard },
      { name: 'Review Queue', path: '/quality-officer/queue', icon: FlaskConical },
      { name: 'Inspection Ledger', path: '/quality-officer/inspections', icon: ClipboardCheck }
    ]
  },
  '/regulator': {
    roleId: 6,
    theme: 'amber',
    title: 'Pharmaceutical Safety Command Center',
    bgImage: '/regulator-bg.jpg',
    menu: [
      { name: 'Command Center', path: '/regulator', icon: LayoutDashboard }
    ]
  },
  '/customer': {
    roleId: 4,
    theme: 'pink',
    title: 'Patient Portal',
    bgImage: '/customer-bg.jpg',
    menu: [
      { name: 'My Medicine Cabinet', path: '/customer', icon: Package },
      { name: 'Patient History', path: '/customer/history', icon: Clock },
      { name: 'Verify Authenticity', path: '/verify', icon: ShieldAlert },
      { name: 'Global Tracking', path: '/track', icon: Map }
    ]
  },
  '/admin': {
    roleId: 0,
    theme: 'rose',
    title: 'System Administration',
    bgImage: '/admin-bg.jpg',
    menu: [
      { name: 'Command Center', path: '/admin', icon: LayoutDashboard }
    ]
  }
};

const getThemeClasses = (theme) => {
  const map = {
    'blue': { bg: 'bg-blue-600', text: 'text-blue-600', lightBg: 'bg-blue-50', hover: 'hover:bg-blue-50 hover:text-blue-900', border: 'border-blue-200' },
    'teal': { bg: 'bg-teal-600', text: 'text-teal-600', lightBg: 'bg-teal-50', hover: 'hover:bg-teal-50 hover:text-teal-900', border: 'border-teal-200' },
    'indigo': { bg: 'bg-indigo-600', text: 'text-indigo-600', lightBg: 'bg-indigo-50', hover: 'hover:bg-indigo-50 hover:text-indigo-900', border: 'border-indigo-200' },
    'emerald': { bg: 'bg-emerald-600', text: 'text-emerald-600', lightBg: 'bg-emerald-50', hover: 'hover:bg-emerald-50 hover:text-emerald-900', border: 'border-emerald-200' },
    'purple': { bg: 'bg-purple-600', text: 'text-purple-600', lightBg: 'bg-purple-50', hover: 'hover:bg-purple-50 hover:text-purple-900', border: 'border-purple-200' },
    'amber': { bg: 'bg-amber-600', text: 'text-amber-600', lightBg: 'bg-amber-50', hover: 'hover:bg-amber-50 hover:text-amber-900', border: 'border-amber-200' },
    'sky': { bg: 'bg-sky-600', text: 'text-sky-600', lightBg: 'bg-sky-50', hover: 'hover:bg-sky-50 hover:text-sky-900', border: 'border-sky-200' },
    'slate': { bg: 'bg-slate-800', text: 'text-slate-800', lightBg: 'bg-slate-100', hover: 'hover:bg-slate-700 hover:text-white', border: 'border-slate-300' },
  };
  return map[theme] || map['blue'];
};

const DashboardLayout = () => {
  const { account, entityInfo, isOwner, disconnectWallet } = useWeb3();
  const location = useLocation();
  const navigate = useNavigate();

  const pathBase = '/' + location.pathname.split('/')[1];
  const config = ROLE_CONFIGS[pathBase] || ROLE_CONFIGS['/manufacturer'];
  const themeClasses = getThemeClasses(config.theme);
  
  // Security Enforcement Rule
  const isDemoMode = (config.roleId === 0 && !isOwner) || (config.roleId !== 0 && entityInfo?.role !== config.roleId);

  const handleExit = () => {
    disconnectWallet();
    navigate('/');
  };

  const handleSwitchWorkspace = () => {
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col z-20 border-r border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl relative">
        <div className="h-16 flex items-center px-6 border-b border-white/10 relative overflow-hidden">
          <div className={`absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-${config.theme}-500 to-transparent`} />
          <AnimatedLogo size="small" theme="white" />
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 relative">
          {config.menu.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center px-3 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative group overflow-hidden ${
                  isActive 
                    ? 'text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                {isActive && (
                  <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-white/10 z-0" />
                )}
                <Icon className={`h-5 w-5 mr-3 relative z-10 ${isActive ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="relative z-10 tracking-wide">{item.name}</span>
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center space-x-3 mb-3 relative z-10">
            <div className="p-2 rounded-xl bg-white/10 border border-white/20 shadow-inner">
              <User className="h-4 w-4 text-slate-300" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate drop-shadow-md">
                {isOwner ? 'System Admin' : (entityInfo?.name || 'Unknown Entity')}
              </p>
              <p className="text-xs text-blue-400 font-mono font-bold tracking-wider truncate">
                {isOwner ? 'SUPERUSER' : getRoleLabel(entityInfo?.role).toUpperCase()}
              </p>
            </div>
          </div>
          <div className="text-[10px] font-mono break-all p-2 rounded-lg bg-black/60 border border-white/10 text-slate-400 relative z-10">
            {account || 'NO_CONNECTION'}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 flex items-center justify-between px-6 z-30 sticky top-0 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-lg">
          <div className="flex items-center">
            <h2 className="text-xl font-black text-white tracking-tight drop-shadow-md">
              <span className="text-blue-500 mr-2">/</span>
              {config.title}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={handleSwitchWorkspace} className="text-xs font-mono font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-300 hover:text-white">
              Switch Workspace
            </button>
            <NotificationCenter />
            <div className="h-6 w-px mx-2 bg-white/10"></div>
            <button onClick={handleExit} className="opacity-70 hover:opacity-100 hover:text-red-400 flex items-center text-sm font-bold transition-all hover:drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]">
              <LogOut className="h-4 w-4 mr-1.5" /> <span className="hidden sm:inline tracking-widest uppercase text-xs">Exit</span>
            </button>
          </div>
        </header>
        
        {/* Security Warning Banner */}
        <AnimatePresence>
          {isDemoMode && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-amber-500/20 backdrop-blur-md border-b border-amber-500/50 px-6 py-3 flex items-start sm:items-center space-x-3 shadow-lg z-20 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-amber-500/10 animate-pulse"></div>
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 relative z-10" />
              <div className="text-amber-100 text-sm font-medium relative z-10">
                <span className="font-black text-amber-400 mr-2 tracking-wide">SECURE DEMO MODE:</span> 
                Cryptographic signatures require authorized wallet connection.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto relative bg-cover bg-center bg-fixed bg-no-repeat" style={{ backgroundImage: `url(${config.bgImage})` }}>
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl z-0"></div>
          
          <motion.div 
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative z-10 w-full h-full p-4 md:p-6 lg:p-8 flex flex-col"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
