import React from "react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger, 
} from "@/components/ui/dropdown-menu";

const ConnectWallet: React.FC = () => {
  const { account, connectWallet, disconnectWallet, isConnecting, error } = useWallet();

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex items-center">
      {error && (
        <div className="mr-2 text-xs text-red-500">
          {error.includes("MetaMask not installed") ? "MetaMask not installed" : "Error connecting"}
        </div>
      )}
      
      {!account ? (
        <Button 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          size="sm"
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="border-primary text-primary">
              {shortenAddress(account)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(account);
              }}
              className="cursor-pointer"
            >
              Copy Address
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={disconnectWallet}
              className="cursor-pointer"
            >
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default ConnectWallet;