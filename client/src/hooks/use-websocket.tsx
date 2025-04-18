import { useCallback, useEffect, useRef, useState } from 'react';

export type WebSocketMessage = {
  type: string;
  [key: string]: any;
}

type WebSocketHookOptions = {
  reconnectInterval?: number;
  reconnectAttempts?: number;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  automaticOpen?: boolean;
};

type WebSocketHookReturn = {
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  readyState: number;
  getWebSocket: () => WebSocket | null;
  connectionStatus: 'connecting' | 'open' | 'closing' | 'closed' | 'reconnecting';
};

export function useWebSocket(
  options: WebSocketHookOptions = {}
): WebSocketHookReturn {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'open' | 'closing' | 'closed' | 'reconnecting'>('closed');
  
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  const {
    reconnectInterval = 5000,
    reconnectAttempts = 3,
    onOpen,
    onClose,
    onMessage,
    onError,
    automaticOpen = true,
  } = options;

  // Create and connect WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      // Clean up existing connection if any
      if (websocketRef.current) {
        if (websocketRef.current.readyState !== WebSocket.CLOSING && 
            websocketRef.current.readyState !== WebSocket.CLOSED) {
          websocketRef.current.close();
        }
      }

      // Use environment variable for WebSocket URL if available, otherwise fallback to auto-detection
      let wsUrl;
      if (import.meta.env.VITE_WS_URL) {
        wsUrl = import.meta.env.VITE_WS_URL;
      } else {
        // Fallback to auto-detection
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}/ws`;
      }
      
      console.log(`Connecting to WebSocket at: ${wsUrl}`);
      setConnectionStatus('connecting');
      
      // Create new websocket connection
      websocketRef.current = new WebSocket(wsUrl);
      
      websocketRef.current.onopen = (event) => {
        console.log('WebSocket connection established');
        setReadyState(WebSocket.OPEN);
        setConnectionStatus('open');
        
        if (onOpen) {
          onOpen(event);
        }
      };
      
      websocketRef.current.onclose = (event) => {
        console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`);
        setReadyState(WebSocket.CLOSED);
        setConnectionStatus('closed');
        
        if (onClose) {
          onClose(event);
        }
        
        // Simple reconnection logic - only if not intentional close
        if (event.code !== 1000 && navigator.onLine) {
          setConnectionStatus('reconnecting');
          
          // Clear any existing reconnect timer
          if (reconnectTimerRef.current !== null) {
            window.clearTimeout(reconnectTimerRef.current);
          }
          
          reconnectTimerRef.current = window.setTimeout(() => {
            connectWebSocket();
          }, reconnectInterval);
        }
      };
      
      websocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          // Handle message_sent events to avoid duplicates
          if (data.type === 'message_sent' && data.message?.id) {
            // Check if we've already processed this message
            const processedMessages = JSON.parse(sessionStorage.getItem('processedMessageIds') || '[]');
            const messageId = data.message.id;
            
            if (processedMessages.includes(messageId)) {
              console.log('Duplicate message_sent event detected, ignoring:', messageId);
              // Don't update lastMessage state for duplicate confirmations
              return;
            }
            
            // Add to processed messages
            processedMessages.push(messageId);
            sessionStorage.setItem('processedMessageIds', JSON.stringify(processedMessages));
            
            // Limit the size of the processed messages array to avoid memory issues
            if (processedMessages.length > 100) {
              processedMessages.shift(); // Remove oldest message
              sessionStorage.setItem('processedMessageIds', JSON.stringify(processedMessages));
            }
          }
          
          // Update last message for all message types
          setLastMessage(data);
          
          if (onMessage) {
            onMessage(event);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      websocketRef.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        
        if (onError) {
          onError(event);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionStatus('closed');
    }
  }, [onClose, onError, onMessage, onOpen, reconnectInterval]);

  // Send a message through the WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      try {
        websocketRef.current.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        return false;
      }
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
      return false;
    }
  }, []);

  // Get the current WebSocket instance
  const getWebSocket = useCallback(() => {
    return websocketRef.current;
  }, []);

  // Set up the WebSocket connection
  useEffect(() => {
    if (automaticOpen) {
      connectWebSocket();
    }

    // Clean up WebSocket connection and timers on unmount
    return () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      
      if (websocketRef.current) {
        websocketRef.current.close(1000, 'Component unmounted');
        websocketRef.current = null;
      }
    };
  }, [automaticOpen, connectWebSocket]);

  return {
    sendMessage,
    lastMessage,
    readyState,
    getWebSocket,
    connectionStatus,
  };
}