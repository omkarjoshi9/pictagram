import React from 'react';
import { useWebSocketContext } from './WebSocketProvider';
import { Badge } from '@/components/ui/badge';

export function WebSocketStatus() {
  const { connectionStatus } = useWebSocketContext();

  // Simplify the status indicator - only show when actively connected
  if (connectionStatus !== 'open') {
    return null;
  }

  return (
    <Badge 
      variant="default" 
      className="text-xs"
    >
      Connected
    </Badge>
  );
}