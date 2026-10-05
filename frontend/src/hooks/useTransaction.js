import { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '../config/network';
import toast from 'react-hot-toast';

export const useTransaction = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { contract, account, signer } = useWeb3();

  const execute = async (methodName, ...args) => {
    if (!contract) {
      const msg = "Contract not loaded";
      setError(msg);
      toast.error(msg);
      return false;
    }

    setIsLoading(true);
    setError(null);
    try {
      let activeContract = contract;

      // Auto-bind authorized role signer for local network development
      if (account) {
        try {
          const currentSignerAddress = signer ? (await signer.getAddress()).toLowerCase() : null;
          if (!currentSignerAddress || currentSignerAddress !== account.toLowerCase()) {
            const localProvider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
            const roleSigner = await localProvider.getSigner(account);
            activeContract = contract.connect(roleSigner);
          }
        } catch (e) {
          console.warn("Could not attach role signer, falling back to existing contract runner:", e);
        }
      }

      const fn = activeContract[methodName] || (activeContract.getFunction ? activeContract.getFunction(methodName) : null);
      if (!fn) throw new Error(`Method ${methodName} not found on contract`);

      const tx = await fn(...args);
      await tx.wait();
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error(`Transaction failed: ${methodName}`, err);
      const msg = err.reason || err.shortMessage || err.message || "Transaction failed";
      setError(msg);
      toast.error(`Blockchain Error: ${msg}`);
      setIsLoading(false);
      return false;
    }
  };

  return { execute, isLoading, error };
};

