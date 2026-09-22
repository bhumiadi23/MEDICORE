import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContract } from '../blockchain/contract';

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [entityInfo, setEntityInfo] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsConnecting(true);
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const account = await signer.getAddress();
        
        setProvider(provider);
        setSigner(signer);
        setAccount(account);
        
        const contractInstance = await getContract(signer);
        setContract(contractInstance);
        
        if (contractInstance) {
          try {
            const ownerAddress = await contractInstance.owner();
            const ownerMatch = ownerAddress.toLowerCase() === account.toLowerCase();
            setIsOwner(ownerMatch);

            const entity = await contractInstance.getEntityByWallet(account);
            if (entity.isRegistered) {
              setEntityInfo({
                name: entity.name,
                id: entity.id,
                role: Number(entity.role),
                isRegistered: entity.isRegistered,
                isActive: entity.isActive
              });
            } else if (ownerMatch) {
              // Owner doesn't need to be explicitly registered
              setEntityInfo({ isRegistered: true, role: 99, name: 'System Admin' });
            } else {
              setEntityInfo({ isRegistered: false });
            }
          } catch (err) {
            console.error("Error fetching entity info:", err);
            setEntityInfo({ isRegistered: false });
          }
        }
      } catch (error) {
        console.error("User rejected request or error occurred", error);
      } finally {
        setIsConnecting(false);
      }
    } else {
      alert("Please install MetaMask!");
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        const intentionallyDisconnected = localStorage.getItem('manuallyDisconnected') === 'true';
        
        if (accounts.length > 0 && !intentionallyDisconnected) {
          await connectWallet();
        } else {
          setIsConnecting(false);
        }

        window.ethereum.on('accountsChanged', (accounts) => {
          if (accounts.length > 0 && localStorage.getItem('manuallyDisconnected') !== 'true') {
            connectWallet();
          } else {
            setAccount(null);
            setEntityInfo(null);
          }
        });
        
        window.ethereum.on('chainChanged', () => {
          window.location.reload();
        });
      } else {
        setIsConnecting(false);
      }
    };
    init();
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    }
  }, []);

  const connectWalletWrapper = async () => {
    localStorage.removeItem('manuallyDisconnected');
    await connectWallet();
  }

  const disconnectWallet = () => {
    localStorage.setItem('manuallyDisconnected', 'true');
    setAccount(null);
    setEntityInfo(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setIsOwner(false);
  };

  return (
    <Web3Context.Provider value={{ provider, signer, account, contract, entityInfo, isOwner, isConnecting, connectWallet: connectWalletWrapper, disconnectWallet, setEntityInfo }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
