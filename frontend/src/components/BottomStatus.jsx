import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { NETWORK_CONFIG } from '../config/network';

const BottomStatus = () => {
  const { account, contract, isConnecting } = useWeb3();

  return (
    <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 px-4 py-1.5 flex justify-between items-center z-[100] text-xs font-mono text-slate-400">
      <div className="flex items-center space-x-4">
        <span className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${contract ? 'bg-emerald-500' : (isConnecting ? 'bg-amber-500 animate-pulse' : 'bg-red-500')}`}></div>
          {contract ? `Network: ${NETWORK_CONFIG.chainName} (ChainID: ${NETWORK_CONFIG.chainId})` : 'Network: Disconnected'}
        </span>
      </div>
      <div>
        {account ? `Wallet: ${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 'No Wallet Connected'}
      </div>
    </div>
  );
};

export default BottomStatus;
