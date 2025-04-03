import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useWebSocket, WebSocketMessage } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { queryClient } from '@/lib/queryClient';

type WebSocketContextType = {
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  connectionStatus: 'connecting' | 'open' | 'closing' | 'closed' | 'reconnecting';
  isAuthenticated: boolean;
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
  const { user } = useWallet();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Connection handlers with authentication
  const onOpen = useCallback(() => {
    // Connection established
    console.log('WebSocket connection established');
    
    // Authenticate WebSocket connection with user ID if available
    if (user?.id) {
      setTimeout(() => {
        sendMessage({
          type: 'authenticate',
          userId: user.id
        });
        console.log('Sent WebSocket authentication for user', user.id);
      }, 500); // Small delay to ensure connection is fully established
    }
  }, [user?.id]);

  const onClose = useCallback(() => {
    // Connection closed, reset authentication
    console.log('WebSocket connection closed');
    setIsAuthenticated(false);
  }, []);

  const onError = useCallback(() => {
    console.error('WebSocket connection error');
    setIsAuthenticated(false);
  }, []);
  
  const onMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      // Handle authentication confirmation
      if (data.type === 'authenticated' && data.success) {
        setIsAuthenticated(true);
        console.log('WebSocket authenticated successfully');
      }
      
      // Handle new message notifications
      else if (data.type === 'new_message') {
        // Show toast notification for new messages
        toast({
          title: 'New Message',
          description: 'You have received a new message',
          variant: 'default'
        });
      }
      
      // Handle notifications
      else if (data.type === 'notification') {
        const notification = data.data;
        
        // Determine notification content based on type
        let title = 'New Notification';
        let description = 'You have a new notification';
        
        if (notification.type === 'like') {
          title = 'New Like';
          description = 'Someone liked your post';
        } else if (notification.type === 'comment') {
          title = 'New Comment';
          description = 'Someone commented on your post';
        } else if (notification.type === 'follow') {
          title = 'New Follower';
          description = 'Someone started following you';
        } else if (notification.type === 'mention') {
          title = 'New Mention';
          description = 'Someone mentioned you in a comment';
        }
        
        // Show toast notification
        toast({
          title,
          description,
          variant: 'default'
        });
        
        // Invalidate notifications query to refresh notifications list
        if (user?.id) {
          queryClient.invalidateQueries({ queryKey: ['/api/users', user.id, 'notifications'] });
        }
      }
      
      // Handle notification read confirmations
      else if (data.type === 'notification_read_confirmed') {
        // Invalidate notifications query to refresh notifications list
        if (user?.id) {
          queryClient.invalidateQueries({ queryKey: ['/api/users', user.id, 'notifications'] });
        }
      }
      
      // Handle all notifications read confirmations
      else if (data.type === 'notifications_read_all_confirmed') {
        // Invalidate notifications query to refresh notifications list
        if (user?.id) {
          queryClient.invalidateQueries({ queryKey: ['/api/users', user.id, 'notifications'] });
        }
      }
    } catch (error) {
      console.error('Error processing message', error);
    }
  }, [toast, user?.id]);

  // Use WebSocket with reconnection logic
  const { 
    sendMessage, 
    lastMessage, 
    connectionStatus
  } = useWebSocket({
    onOpen,
    onClose,
    onError,
    onMessage,
    reconnectInterval: 5000,
    reconnectAttempts: 5
  });
  
  // Re-authenticate when user changes
  useEffect(() => {
    if (connectionStatus === 'open' && user?.id && !isAuthenticated) {
      sendMessage({
        type: 'authenticate',
        userId: user.id
      });
      console.log('Re-authenticating WebSocket for user', user.id);
    }
  }, [user?.id, connectionStatus, isAuthenticated, sendMessage]);

  const value = {
    sendMessage,
    lastMessage,
    connectionStatus,
    isAuthenticated
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}