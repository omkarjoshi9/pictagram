import React from "react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger, 
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

const ConnectWallet: React.FC = () => {
  const { account, user, connectWallet, disconnectWallet, isConnecting, error } = useWallet();
  const [, setLocation] = useLocation();

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
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
            <Button variant="outline" size="sm" className="border-primary text-primary flex items-center gap-2">
              {user && (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.profilePic} alt={user.username} />
                  <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                </Avatar>
              )}
              {shortenAddress(account)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {user && (
              <>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {shortenAddress(account)}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(account);
              }}
              className="cursor-pointer"
            >
              Copy Address
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLocation("/profile")}
              className="cursor-pointer"
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={disconnectWallet}
              className="cursor-pointer text-destructive focus:bg-destructive/10"
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