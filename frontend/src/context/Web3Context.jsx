import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getContract } from '../blockchain/contract';
import { NETWORK_CONFIG } from '../config/network';
import { getRoleConfigForAddress } from '../config/roles';

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [entityInfo, setEntityInfo] = useState(null);
  const [currentRoleConfig, setCurrentRoleConfig] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  // Fallback Read-Only Provider
  useEffect(() => {
    const initReadOnly = async () => {
      if (!contract && !isConnecting && !account) {
        try {
          const fallbackProvider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
          const fallbackContract = await getContract(fallbackProvider);
          setContract(fallbackContract);
        } catch (e) {
          console.error("Fallback provider failed", e);
        }
      }
    };
    initReadOnly();
  }, [contract, isConnecting, account]);

  const connectWallet = useCallback(async (isSilent = false) => {
    if (window.ethereum) {
      try {
        if (!isSilent) setIsConnecting(true);
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        
        // Ensure Correct Network
        const network = await web3Provider.getNetwork();
        if (Number(network.chainId) !== NETWORK_CONFIG.chainId) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}` }],
            });
          } catch (switchError) {
            console.error("Please switch to Hardhat localhost", switchError);
            if (!isSilent) alert(`Please switch your wallet to ${NETWORK_CONFIG.chainName}`);
          }
        }

        const accounts = await web3Provider.send("eth_requestAccounts", []);
        if (!accounts || accounts.length === 0) throw new Error("No accounts found");
        
        const web3Signer = await web3Provider.getSigner();
        const address = await web3Signer.getAddress();
        
        setProvider(web3Provider);
        setSigner(web3Signer);
        setAccount(address.toLowerCase());
        
        const contractInstance = await getContract(web3Signer);
        setContract(contractInstance);
        
        let resolvedEntity = null;
        if (contractInstance) {
          try {
            const ownerAddress = await contractInstance.owner();
            const ownerMatch = ownerAddress.toLowerCase() === address.toLowerCase();
            setIsOwner(ownerMatch);

            const entity = await contractInstance.getEntityByWallet(address);
            if (entity && entity.isRegistered) {
              resolvedEntity = {
                name: entity.name,
                id: entity.id,
                role: Number(entity.role),
                isRegistered: true,
                isActive: entity.isActive
              };
            } else if (ownerMatch) {
              resolvedEntity = { isRegistered: true, role: 0, name: 'System Admin' };
            } else {
              resolvedEntity = { isRegistered: false, role: null };
            }
            setEntityInfo(resolvedEntity);
          } catch (err) {
            console.error("Error fetching entity info:", err);
            resolvedEntity = { isRegistered: false, role: null };
            setEntityInfo(resolvedEntity);
          }
        }

        const roleConfig = getRoleConfigForAddress(address, resolvedEntity?.role);
        setCurrentRoleConfig(roleConfig);
        return { success: true, address, roleConfig, entityInfo: resolvedEntity };
      } catch (error) {
        console.error("Connection error:", error);
        return { success: false, error };
      } finally {
        setIsConnecting(false);
      }
    } else {
      if (!isSilent) alert("Please install MetaMask!");
      setIsConnecting(false);
      return { success: false, error: 'No wallet detected' };
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const checkConnection = async () => {
      if (window.ethereum) {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await web3Provider.listAccounts();
        const intentionallyDisconnected = localStorage.getItem('manuallyDisconnected') === 'true';
        
        if (accounts.length > 0 && !intentionallyDisconnected) {
          await connectWallet(true);
        } else {
          if (mounted) setIsConnecting(false);
        }

        const handleAccountsChanged = (accounts) => {
          if (accounts.length > 0 && localStorage.getItem('manuallyDisconnected') !== 'true') {
            connectWallet(true);
          } else {
            disconnectWallet();
          }
        };

        const handleChainChanged = () => {
          window.location.reload();
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
      } else {
        if (mounted) setIsConnecting(false);
      }
    };
    
    checkConnection();
    return () => { mounted = false; };
  }, [connectWallet]);

  const disconnectWallet = () => {
    localStorage.setItem('manuallyDisconnected', 'true');
    setAccount(null);
    setEntityInfo(null);
    setCurrentRoleConfig(null);
    setProvider(null);
    setSigner(null);
    setIsOwner(false);
    setContract(null); // Triggers fallback
  };

  return (
    <Web3Context.Provider value={{ provider, signer, account, contract, entityInfo, isOwner, isConnecting, currentRoleConfig, setCurrentRoleConfig, connectWallet, disconnectWallet, setEntityInfo }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
