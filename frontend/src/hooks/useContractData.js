import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';

export const useContractData = (methodName, ...args) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { contract } = useWeb3();

  const fetchData = useCallback(async () => {
    if (!contract) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await contract[methodName](...args);
      setData(result);
    } catch (err) {
      console.error(`Fetch failed: ${methodName}`, err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [contract, methodName, ...args]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
};
