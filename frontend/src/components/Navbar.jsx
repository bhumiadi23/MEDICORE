import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { Activity, ShieldCheck, User } from 'lucide-react';
import { shortAddress, getRoleLabel } from '../utils/helpers';
import AnimatedLogo from './AnimatedLogo';

const Navbar = () => {
  const { account, entityInfo, connectWallet, disconnectWallet } = useWeb3();
  const location = useLocation();

  return (
    <nav className="bg-brand-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center mr-8">
              <AnimatedLogo theme="white" />
            </Link>
            
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link to="/verify" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/verify' ? 'bg-brand-800 text-white' : 'text-gray-300 hover:bg-brand-700 hover:text-white'}`}>
                Verify Drug
              </Link>
              <Link to="/track" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/track' ? 'bg-brand-800 text-white' : 'text-gray-300 hover:bg-brand-700 hover:text-white'}`}>
                Track Drug
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {account ? (
              <div className="flex items-center space-x-4">
                {entityInfo?.isRegistered ? (
                  <>
                    <Link to={entityInfo.role === 1 ? '/manufacturer' : entityInfo.role === 2 ? '/wholesaler' : entityInfo.role === 3 ? '/retailer' : entityInfo.role === 4 ? '/customer' : entityInfo.role === 5 ? '/transporter' : entityInfo.role === 6 ? '/regulator' : '/quality-officer'} className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-white text-brand-900 hover:bg-gray-100 transition-colors">
                      Go to Dashboard
                    </Link>
                    <span className="hidden md:inline px-3 py-1 rounded-full text-xs font-semibold bg-brand-800 border border-brand-700">
                      {getRoleLabel(entityInfo.role)}
                    </span>
                  </>
                ) : (
                  <Link to="/register" className="text-sm text-brand-300 hover:text-white underline">Register Entity</Link>
                )}
                <div className="flex items-center space-x-2 bg-brand-800 px-3 py-1.5 rounded-lg border border-brand-700">
                  <User className="h-4 w-4 text-brand-400" />
                  <span className="text-sm font-medium">{shortAddress(account)}</span>
                </div>
                <button onClick={disconnectWallet} className="text-sm text-gray-400 hover:text-red-400 font-medium ml-2">
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={connectWallet}
                className="bg-brand-600 hover:bg-brand-500 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2"
              >
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
