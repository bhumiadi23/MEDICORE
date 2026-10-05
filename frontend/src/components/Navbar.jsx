import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { Activity, ShieldCheck, ShieldAlert, User, ChevronDown, Layers, Check } from 'lucide-react';
import { shortAddress, getRoleLabel } from '../utils/helpers';
import AnimatedLogo from './AnimatedLogo';
import SentinelDefenseShield from './SentinelDefenseShield';
import { ALL_ROLES_LIST, getRoleConfigForAddress } from '../config/roles';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { account, entityInfo, currentRoleConfig, connectWallet, disconnectWallet, triggerRoleLaunchModal, switchActiveRole } = useWeb3();
  const location = useLocation();
  const navigate = useNavigate();
  const [showSentinel, setShowSentinel] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const activeRole = currentRoleConfig || getRoleConfigForAddress(account, entityInfo?.role);

  const handleConnectWallet = async () => {
    try {
      const res = await connectWallet(false);
      if (res && res.success) {
        const { roleConfig, address } = res;
        triggerRoleLaunchModal?.(roleConfig, address);
      }
    } catch (err) {
      console.error("Wallet connection failed", err);
    }
  };

  const handleSwitchWorkspace = async (roleItem) => {
    setShowRoleDropdown(false);
    await switchActiveRole(roleItem.role);
    toast.success(`Switched to ${roleItem.name} workspace!`, { icon: '🚀', duration: 2500 });
    navigate(roleItem.path);
  };

  return (
    <>
      <nav className="bg-brand-900 text-white sticky top-0 z-50 shadow-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center mr-8">
                <AnimatedLogo theme="white" />
              </Link>
              
              <div className="hidden md:ml-10 md:flex md:space-x-8 items-center">
                <Link to="/verify" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/verify' ? 'bg-brand-800 text-white' : 'text-gray-300 hover:bg-brand-700 hover:text-white'}`}>
                  Verify Drug
                </Link>
                <Link to="/track" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/track' ? 'bg-brand-800 text-white' : 'text-gray-300 hover:bg-brand-700 hover:text-white'}`}>
                  Track Drug
                </Link>
                <button
                  onClick={() => setShowSentinel(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30 transition-all flex items-center space-x-1.5 shadow-[0_0_15px_rgba(20,184,166,0.3)]"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                  <span>Sentinel Shield</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {account ? (
                <div className="flex items-center space-x-3">
                  {/* Workspace Role Switcher Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                      className="flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-white/10 transition-all text-white shadow-sm"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="max-w-[130px] truncate">{activeRole?.name || 'Workspace'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showRoleDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showRoleDropdown && (
                      <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden z-50 p-2 backdrop-blur-xl">
                        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 flex items-center justify-between">
                          <span>Active Role Workspaces</span>
                          <Layers className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <div className="py-1 space-y-0.5">
                          {ALL_ROLES_LIST.map((r) => {
                            const isCurrent = location.pathname.startsWith(r.path);
                            return (
                              <button
                                key={r.role}
                                onClick={() => handleSwitchWorkspace(r)}
                                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all ${
                                  isCurrent
                                    ? 'bg-blue-600/30 text-blue-300 font-bold border border-blue-500/30'
                                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-blue-400' : 'bg-slate-500'}`}></span>
                                  <span>{r.name}</span>
                                </div>
                                {isCurrent && <Check className="w-3.5 h-3.5 text-blue-400" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Connected Wallet Address */}
                  <div className="hidden sm:flex items-center space-x-1.5 bg-brand-800 px-3 py-1.5 rounded-xl border border-brand-700 font-mono text-xs text-slate-300">
                    <User className="h-3.5 w-3.5 text-brand-400" />
                    <span>{shortAddress(account)}</span>
                  </div>

                  <button 
                    onClick={disconnectWallet} 
                    className="text-xs text-slate-400 hover:text-red-400 font-medium px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleConnectWallet}
                  className="bg-brand-600 hover:bg-brand-500 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center space-x-2 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:scale-105"
                >
                  <Activity className="w-4 h-4 text-blue-200" />
                  <span>Connect Wallet</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <SentinelDefenseShield
        isOpen={showSentinel}
        onClose={() => setShowSentinel(false)}
      />
    </>
  );
};

export default Navbar;
