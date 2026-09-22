import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { motion } from 'framer-motion';
import { Wallet, Activity, ShieldCheck, ExternalLink } from 'lucide-react';
import { ROLE_ROUTES } from '../utils/helpers';

const ConnectWallet = () => {
  const { account, connectWallet, entityInfo, isOwner } = useWeb3();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (account) {
      if (isOwner) {
        navigate('/admin');
      } else if (entityInfo?.isRegistered) {
        navigate(ROLE_ROUTES[entityInfo.role] || '/');
      } else {
        navigate('/register');
      }
    }
  }, [account, entityInfo, isOwner, navigate]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
    } catch (e) {
      console.error(e);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 bg-slate-50 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center border border-slate-100"
      >
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-blue-100">
          <Wallet className="h-10 w-10 text-blue-600" />
        </div>
        
        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Connect Wallet</h2>
        <p className="text-slate-500 mb-10 leading-relaxed text-sm">
          Authenticate using your Web3 wallet to access the secure enterprise pharmaceutical network.
        </p>
        
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 px-6 rounded-xl shadow-md transition-all flex items-center justify-center space-x-3 disabled:opacity-70 disabled:cursor-not-allowed group"
        >
          {isConnecting ? (
            <Activity className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="text-lg">Metamask</span>
            </>
          )}
        </button>

        <div className="mt-8 flex items-center justify-center space-x-2 text-sm text-slate-500 bg-slate-50 py-3 rounded-lg border border-slate-100">
          <ShieldCheck className="h-4 w-4 text-green-500" />
          <span>Secure Web3 Authentication</span>
        </div>
        
        <p className="mt-8 text-sm text-slate-400">
          New to Web3? <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="text-blue-600 font-medium hover:underline inline-flex items-center">Download MetaMask <ExternalLink className="h-3 w-3 ml-1" /></a>
        </p>
      </motion.div>
    </div>
  );
};

export default ConnectWallet;
