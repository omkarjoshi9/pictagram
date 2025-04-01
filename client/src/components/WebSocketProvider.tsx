import React, { createContext, useContext, useCallback, useState } from 'react';
import { useWebSocket, WebSocketMessage } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';

type WebSocketContextType = {
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  connectionStatus: 'connecting' | 'open' | 'closing' | 'closed' | 'reconnecting';
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}

type WebSocketProviderProps = {
  children: React.ReactNode;
};

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const toastData = useToast();
  const { toast, dismiss } = toastData;
  const [connectionLostTime, setConnectionLostTime] = useState<number | null>(null);
  const [showedReconnectToast, setShowedReconnectToast] = useState(false);
  const toastIdRef = React.useRef<string | null>(null);
  
  // We don't want to show connection notifications during initial page load
  const initialLoadRef = React.useRef(true);
  React.useEffect(() => {
    // Mark initial load as complete after a short delay
    const timer = setTimeout(() => {
      initialLoadRef.current = false;
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const onOpen = useCallback(() => {
    // If we were previously disconnected for more than 5 seconds, show reconnected toast
    if (connectionLostTime && Date.now() - connectionLostTime > 5000 && !initialLoadRef.current) {
      toast({
        title: 'Reconnected',
        description: 'Real-time connection restored',
        variant: 'default',
        duration: 3000
      });
    }
    setConnectionLostTime(null);
    setShowedReconnectToast(false);
    
    // If we had a pending toast, dismiss it
    if (toastIdRef.current) {
      dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
  }, [toast, dismiss, connectionLostTime]);

  const onClose = useCallback(() => {
    // Record when the connection was lost
    if (!connectionLostTime) {
      setConnectionLostTime(Date.now());
    }
  }, [connectionLostTime]);

  const onError = useCallback(() => {
    // Only show error toasts in production, not during development
    if (process.env.NODE_ENV !== 'development' && !initialLoadRef.current) {
      toast({
        title: 'Connection issue',
        description: 'Trying to reconnect...',
        variant: 'destructive'
      });
    }
  }, [toast]);

  const { 
    sendMessage, 
    lastMessage, 
    connectionStatus
  } = useWebSocket({
    onOpen,
    onClose,
    onError,
    reconnectInterval: 2000,
    reconnectAttempts: 15
  });

  // Show reconnecting toast only if disconnected for a while (avoid toast spam)
  React.useEffect(() => {
    let timer: number | null = null;
    
    if (connectionStatus === 'reconnecting' && !showedReconnectToast && connectionLostTime) {
      // Only show reconnect toast if we've been disconnected for a while
      const disconnectedDuration = Date.now() - connectionLostTime;
      
      if (disconnectedDuration > 8000 && !initialLoadRef.current) {
        timer = window.setTimeout(() => {
          const result = toast({
            title: 'Connection lost',
            description: 'Attempting to reconnect...',
            variant: 'destructive',
            duration: Infinity,
          });
          toastIdRef.current = result.id;
          setShowedReconnectToast(true);
        }, 2000); // Additional delay before showing toast
      }
    } else if (connectionStatus === 'open' && toastIdRef.current) {
      // Dismiss previous toast if it exists
      if (toastIdRef.current) {
        dismiss(toastIdRef.current);
      }
      
      // Show connected toast
      toast({
        title: 'Connected',
        description: 'Connection restored',
        variant: 'default',
        duration: 3000,
      });
      toastIdRef.current = null;
    }
    
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [connectionStatus, toast, dismiss, showedReconnectToast, connectionLostTime]);

  const value = {
    sendMessage,
    lastMessage,
    connectionStatus
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}