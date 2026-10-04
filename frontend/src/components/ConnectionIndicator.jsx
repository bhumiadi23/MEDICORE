import React from 'react';
import { useWeb3 } from '../context/Web3Context';

const ConnectionIndicator = () => {
  const { account, contract, entityInfo } = useWeb3();
  const connected = !!account;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-4 py-2 flex justify-between items-center text-xs text-slate-400 z-[9999] font-mono">
      <div>
        <strong>Status:</strong> {connected ? 'Connected' : 'Read-Only (Not Connected)'} 
        {entityInfo?.role !== undefined && ` | Role: ${entityInfo.role}`}
      </div>
      <div className="flex gap-4">
        <div><strong>Network:</strong> Hardhat Localhost (Chain ID: 31337)</div>
        {account && <div><strong>Wallet:</strong> {account.slice(0, 6)}...{account.slice(-4)}</div>}
      </div>
    </div>
  );
};

export default ConnectionIndicator;
