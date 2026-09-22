import { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

export const useTransaction = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { contract } = useWeb3();

  const execute = async (methodName, ...args) => {
    if (!contract) {
      setError("Contract not loaded");
      return false;
    }

    setIsLoading(true);
    setError(null);
    try {
      const tx = await contract[methodName](...args);
      await tx.wait();
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error(`Transaction failed: ${methodName}`, err);
      setError(err.reason || err.message || "Transaction failed");
      setIsLoading(false);
      return false;
    }
  };

  return { execute, isLoading, error };
};
