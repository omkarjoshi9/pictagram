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
  
  // Simple connection handlers with minimal notifications
  const onOpen = useCallback(() => {
    // Connection established
    console.log('WebSocket connection established');
  }, []);

  const onClose = useCallback(() => {
    // Connection closed
    console.log('WebSocket connection closed');
  }, []);

  const onError = useCallback(() => {
    console.error('WebSocket connection error');
  }, []);

  // Use WebSocket with minimal reconnection logic
  const { 
    sendMessage, 
    lastMessage, 
    connectionStatus
  } = useWebSocket({
    onOpen,
    onClose,
    onError,
    reconnectInterval: 5000,
    reconnectAttempts: 3
  });

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