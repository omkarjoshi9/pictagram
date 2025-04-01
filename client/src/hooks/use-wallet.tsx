import { useState, useEffect, createContext, useContext } from "react";
import { ethers } from "ethers";

import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  walletAddress: string;
  profilePic?: string;
  bio?: string;
}

interface WalletContextProps {
  account: string | null;
  chainId: number | null;
  provider: ethers.providers.Web3Provider | null;
  isConnecting: boolean;
  error: string | null;
  user: User | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextProps>({
  account: null,
  chainId: null,
  provider: null,
  isConnecting: false,
  error: null,
  user: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Save user to database
  const saveUserToDatabase = async (address: string) => {
    try {
      const response = await fetch("/api/auth/wallet", {
        method: "POST",
        body: JSON.stringify({ walletAddress: address }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        console.error("Failed to save wallet address to database");
        toast({
          title: "Error",
          description: "Failed to save wallet address. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error saving wallet address:", err);
    }
  };

  // Check if user is already connected on initial load
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (window.ethereum && window.ethereum.selectedAddress) {
          const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
          const network = await ethersProvider.getNetwork();
          
          setProvider(ethersProvider);
          setAccount(window.ethereum.selectedAddress);
          setChainId(network.chainId);
          
          // Save to database
          await saveUserToDatabase(window.ethereum.selectedAddress);
        }
      } catch (err) {
        console.error("Failed to check wallet connection:", err);
      }
    };

    checkConnection();
  }, []);

  // Setup event listeners for wallet events
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        setAccount(null);
        setChainId(null);
        setProvider(null);
        setUser(null);
      } else {
        setAccount(accounts[0]);
        // Save new account to database
        await saveUserToDatabase(accounts[0]);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
    };

    const ethereum = window.ethereum;
    if (ethereum && ethereum.on) {
      ethereum.on("accountsChanged", handleAccountsChanged);
      ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener("accountsChanged", handleAccountsChanged);
          ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
    
    return undefined;
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not installed. Please install MetaMask to connect.");
      }

      const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      });
      
      const network = await ethersProvider.getNetwork();
      
      setProvider(ethersProvider);
      setAccount(accounts[0]);
      setChainId(network.chainId);
      
      // Save wallet address to database
      await saveUserToDatabase(accounts[0]);
      
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been successfully connected.",
      });
    } catch (err: any) {
      console.error("Error connecting wallet:", err);
      setError(err.message || "Failed to connect wallet");
      toast({
        title: "Connection Failed",
        description: err.message || "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setUser(null);
    setError(null);
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        provider,
        isConnecting,
        error,
        user,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}

// Add type definitions for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      selectedAddress?: string;
      request: (request: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, listener: any) => void;
      removeListener: (event: string, listener: any) => void;
    };
  }
}