import React, { useState, useEffect } from 'react';
import { useWebSocketContext } from './WebSocketProvider';
import { Badge } from '@/components/ui/badge';

export function WebSocketStatus() {
  const { connectionStatus } = useWebSocketContext();
  const [showReconnecting, setShowReconnecting] = useState(false);
  const [showDisconnected, setShowDisconnected] = useState(false);
  
  // Don't show brief disconnections to avoid UI flashing
  useEffect(() => {
    let timer: number;
    
    if (connectionStatus === 'reconnecting') {
      // Only show reconnecting after a delay to avoid UI flickering
      timer = window.setTimeout(() => {
        setShowReconnecting(true);
      }, 3000);
    } else if (connectionStatus === 'closing' || connectionStatus === 'closed') {
      // Only show disconnected after a delay
      timer = window.setTimeout(() => {
        setShowDisconnected(true);
      }, 5000);
    } else {
      setShowReconnecting(false);
      setShowDisconnected(false);
    }
    
    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [connectionStatus]);

  // Default state is connected or connecting
  let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  let statusText = 'Connected';
  
  if (connectionStatus === 'open') {
    badgeVariant = 'default';
    statusText = 'Connected';
  } else if (connectionStatus === 'connecting') {
    badgeVariant = 'secondary';
    statusText = 'Connected';  // Show as connected during initial connection
  } else if (connectionStatus === 'reconnecting' && showReconnecting) {
    badgeVariant = 'secondary';
    statusText = 'Connecting...';
  } else if ((connectionStatus === 'closing' || connectionStatus === 'closed') && showDisconnected) {
    badgeVariant = 'destructive';
    statusText = 'Connection lost - refreshing';
  }

  // Don't render anything if we're in a temporary reconnecting state
  if (connectionStatus === 'reconnecting' && !showReconnecting) {
    return null;
  }
  
  // Don't render anything if we're in a temporary disconnected state
  if ((connectionStatus === 'closing' || connectionStatus === 'closed') && !showDisconnected) {
    return null;
  }

  return (
    <Badge 
      variant={badgeVariant} 
      className="text-xs"
    >
      {statusText}
    </Badge>
  );
}