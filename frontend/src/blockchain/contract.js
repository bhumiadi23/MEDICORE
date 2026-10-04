import { ethers } from 'ethers';
import { abi } from './abi';
import { NETWORK_CONFIG } from '../config/network';

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
