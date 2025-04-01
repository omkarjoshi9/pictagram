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
  const reconnectCount = useRef<number>(0);
  const reconnectTimerRef = useRef<number | null>(null);

  const {
    reconnectInterval = 2000, // Reduced interval for faster reconnection
    reconnectAttempts = 15,   // Increased attempts
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
        // Only close if it's not already closing or closed
        if (websocketRef.current.readyState !== WebSocket.CLOSING && 
            websocketRef.current.readyState !== WebSocket.CLOSED) {
          websocketRef.current.close();
        }
      }

      // Determine protocol based on current connection (ws or wss)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Don't change status if we're already reconnecting
      if (connectionStatus !== 'reconnecting') {
        setConnectionStatus('connecting');
      }
      
      // Create new websocket connection
      websocketRef.current = new WebSocket(wsUrl);
      
      websocketRef.current.onopen = (event) => {
        console.log('WebSocket connection established');
        setReadyState(WebSocket.OPEN);
        setConnectionStatus('open');
        reconnectCount.current = 0;
        
        // Send a ping message to confirm connection
        try {
          websocketRef.current?.send(JSON.stringify({ type: 'ping' }));
        } catch (e) {
          // Ignore error if connection dropped
        }
        
        if (onOpen) {
          onOpen(event);
        }
      };
      
      websocketRef.current.onclose = (event) => {
        console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`);
        setReadyState(WebSocket.CLOSED);
        
        // Only change status if we're not already reconnecting
        if (connectionStatus !== 'reconnecting') {
          setConnectionStatus('closed');
        }
        
        if (onClose) {
          onClose(event);
        }
        
        // Check if we should attempt to reconnect
        // Don't reconnect if this was a normal closure, max attempts reached, or browser is offline
        if (event.code !== 1000 && event.code !== 1001 && navigator.onLine) {
          if (reconnectCount.current < reconnectAttempts) {
            reconnectCount.current += 1;
            setConnectionStatus('reconnecting');
            console.log(`Attempting to reconnect (${reconnectCount.current}/${reconnectAttempts})...`);
            
            // Clear any existing reconnect timer
            if (reconnectTimerRef.current !== null) {
              window.clearTimeout(reconnectTimerRef.current);
            }
            
            // Use exponential backoff for reconnection (max 10 seconds)
            const backoffTime = Math.min(reconnectInterval * Math.pow(1.5, reconnectCount.current - 1), 10000);
            
            reconnectTimerRef.current = window.setTimeout(() => {
              connectWebSocket();
            }, backoffTime);
          } else {
            console.error(`WebSocket failed to connect after ${reconnectAttempts} attempts`);
            // Reset reconnect count after a longer timeout to try again
            window.setTimeout(() => {
              reconnectCount.current = 0;
              connectWebSocket();
            }, 30000);
          }
        }
      };
      
      websocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
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
  }, [onClose, onError, onMessage, onOpen, reconnectAttempts, reconnectInterval]);

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