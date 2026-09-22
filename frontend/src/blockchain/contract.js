import { ethers } from 'ethers';
import { abi } from './abi';

export const getContract = async (providerOrSigner) => {
  try {
    const res = await fetch('/deployments.json');
    const { address } = await res.json();
    return new ethers.Contract(address, abi, providerOrSigner);
  } catch (error) {
    console.error("Failed to load contract address", error);
    return null;
  }
};

export const getReadOnlyContract = async () => {
  // Use public RPC if no wallet connected, for now fallback to window.ethereum if available
  if (window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    return getContract(provider);
  }
  // Hardhat local node default URL
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  return getContract(provider);
};
