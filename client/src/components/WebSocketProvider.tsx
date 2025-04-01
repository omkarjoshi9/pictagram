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
  const { toast } = useToast();
  const [toastShown, setToastShown] = useState({
    connected: false,
    disconnected: false,
    reconnecting: false
  });

  const onOpen = useCallback(() => {
    if (!toastShown.connected) {
      toast({
        title: 'Connected',
        description: 'Real-time connection established',
        variant: 'default'
      });
      setToastShown(prev => ({ ...prev, connected: true, disconnected: false, reconnecting: false }));
    }
  }, [toast, toastShown.connected]);

  const onClose = useCallback(() => {
    if (!toastShown.disconnected) {
      toast({
        title: 'Disconnected',
        description: 'Real-time connection lost',
        variant: 'destructive'
      });
      setToastShown(prev => ({ ...prev, disconnected: true }));
    }
  }, [toast, toastShown.disconnected]);

  const onError = useCallback(() => {
    toast({
      title: 'Connection Error',
      description: 'There was a problem with the real-time connection',
      variant: 'destructive'
    });
  }, [toast]);

  const { 
    sendMessage, 
    lastMessage, 
    connectionStatus
  } = useWebSocket({
    onOpen,
    onClose,
    onError,
    reconnectInterval: 3000,
    reconnectAttempts: 15
  });

  // Show reconnecting toast only once per reconnection sequence
  React.useEffect(() => {
    if (connectionStatus === 'reconnecting' && !toastShown.reconnecting) {
      toast({
        title: 'Reconnecting',
        description: 'Attempting to restore real-time connection',
        variant: 'default'
      });
      setToastShown(prev => ({ ...prev, reconnecting: true }));
    }
  }, [connectionStatus, toast, toastShown.reconnecting]);

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